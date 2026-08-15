import asyncio
import random
from typing import Optional
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.trip import Trip, TripStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.websocket.connection_manager import manager
from app.services.eta_service import ETAService

# Global set to keep strong references to active simulation tasks
# to prevent the Python garbage collector from destroying them.
active_simulation_tasks = set()

async def start_simulation_background(tracking_number: str):
    """
    To be called by FastAPI BackgroundTasks. It schedules the actual simulation
    as a separate asyncio task so it doesn't block the ASGI worker.
    """
    task = asyncio.create_task(start_simulation(tracking_number))
    active_simulation_tasks.add(task)
    task.add_done_callback(active_simulation_tasks.discard)

async def start_simulation(tracking_number: str):
    """
    Simulates a trip's movement by sending periodic coordinate updates and 
    advancing the shipment/trip status.
    """
    # Wait a bit before starting
    await asyncio.sleep(2)
    
    db = SessionLocal()
    try:
        shipment = db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()
        if not shipment or not shipment.trip:
            return
            
        trip = shipment.trip
        
        if not trip.route_geometry or not isinstance(trip.route_geometry, list) or len(trip.route_geometry) == 0:
            print(f"[GPS SIMULATOR] Generating missing route geometry for trip {trip.id}...")
            if trip.pickup_latitude is None or trip.destination_latitude is None:
                from app.services.geocoding_service import GeocodingService
                if trip.pickup_latitude is None:
                    plat, plng = GeocodingService.geocode(trip.pickup_location)
                    trip.pickup_latitude = plat
                    trip.pickup_longitude = plng
                if trip.destination_latitude is None:
                    dlat, dlng = GeocodingService.geocode(trip.destination)
                    trip.destination_latitude = dlat
                    trip.destination_longitude = dlng
                db.commit()
            
            from app.services.route_service import RouteService
            route_info = RouteService.get_route(trip.pickup_latitude, trip.pickup_longitude, trip.destination_latitude, trip.destination_longitude)
            trip.distance_km = route_info["distance_km"]
            trip.estimated_duration = route_info["estimated_duration"]
            trip.route_summary = route_info["route_summary"]
            trip.route_geometry = route_info["route_geometry"]
            db.commit()

        coordinates = trip.route_geometry
        total_points = len(coordinates)
        if total_points == 0:
            print(f"[GPS SIMULATOR ERROR] Still no coordinates for trip {trip.id}. Aborting.")
            return
            
        # Optional: Add ETAService calculation
        start_time = datetime.now(timezone.utc)
        eta = ETAService.calculate_eta(start_time, trip.estimated_duration)
        
        print(f"[GPS SIMULATOR] Found {total_points} coordinates for trip {trip.id}")
        
        # We will loop through the coordinates to simulate movement
        for i, coord in enumerate(coordinates):
            lat, lng = coord
            
            if i % 10 == 0:
                print(f"[GPS SIMULATOR] Trip {trip.id} location: latitude={lat}, longitude={lng}")
            
            # Refresh trip to check if it was manually completed/cancelled
            db.refresh(trip)
            if trip.trip_status != TripStatus.IN_TRANSIT:
                print(f"[GPS SIMULATOR] Trip {trip.id} status changed to {trip.trip_status}, stopping simulation.")
                break

            # Update DB with current location
            trip.current_latitude = lat
            trip.current_longitude = lng
            db.commit()
            
            # Determine intermediate status based on progress
            progress = i / total_points
            
            if progress > 0.8 and shipment.current_status != ShipmentStatus.OUT_FOR_DELIVERY:
                shipment.current_status = ShipmentStatus.OUT_FOR_DELIVERY
                db.commit()

            if i % 10 == 0:
                print(f"[GPS SIMULATOR] Broadcasting location_update for trip {trip.id} (tracking: {tracking_number})")

            # Broadcast update
            await manager.broadcast_to_room(tracking_number, {
                "type": "location_update",
                "data": {
                    "tracking_number": tracking_number,
                    "latitude": lat,
                    "longitude": lng,
                    "status": shipment.current_status.value,
                    "eta": eta.isoformat() if eta else None,
                    "progress": progress
                }
            })
            
            # Wait before next move
            await asyncio.sleep(5.0)
            
        # Finish trip if it completed naturally
        if trip.trip_status == TripStatus.IN_TRANSIT:
            trip.trip_status = TripStatus.COMPLETED
            shipment.current_status = ShipmentStatus.DELIVERED
            
            if trip.destination_latitude is not None and trip.destination_longitude is not None:
                trip.current_latitude = trip.destination_latitude
                trip.current_longitude = trip.destination_longitude
                
            db.commit()
            
            await manager.broadcast_to_room(tracking_number, {
                "type": "trip_completed",
                "data": {
                    "tracking_number": tracking_number,
                    "status": shipment.current_status.value,
                    "latitude": trip.destination_latitude,
                    "longitude": trip.destination_longitude
                }
            })
    except Exception as e:
        print(f"[GPS SIMULATOR ERROR] {e}")
    finally:
        db.close()
