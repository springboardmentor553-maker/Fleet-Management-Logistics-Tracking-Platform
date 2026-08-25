import asyncio
from app.database import SessionLocal
from app import models
from app.connection_manager import manager

TICK_SECONDS = 5          # how often we move vehicles
STEP_FRACTION = 0.03      # move 3% of the remaining distance each tick
ARRIVAL_THRESHOLD = 0.001 # ~100m in degrees — close enough to call it "arrived"


async def simulate_vehicle_movement():
    """
    Runs forever in the background. Every TICK_SECONDS, it looks at every
    trip currently marked 'ongoing' with a known pickup/destination and
    an assigned vehicle, nudges that vehicle's position a little closer to
    the destination, saves it, and broadcasts the new position to:
      - the global channel (powers the Dashboard's fleet-wide live map)
      - that trip's own channel (powers a single-trip tracking view)
    """
    while True:
        await asyncio.sleep(TICK_SECONDS)
        db = SessionLocal()
        try:
            ongoing_trips = db.query(models.Trip).filter(models.Trip.status == "ongoing").all()

            for trip in ongoing_trips:
                if trip.destination_lat is None or trip.destination_lng is None:
                    continue  # can't simulate without a destination to move toward

                vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
                if not vehicle:
                    continue

                # Start from the vehicle's current position, or the trip's
                # pickup point if it doesn't have one yet
                start_lat = vehicle.current_lat if vehicle.current_lat is not None else trip.pickup_lat
                start_lng = vehicle.current_lng if vehicle.current_lng is not None else trip.pickup_lng
                if start_lat is None or start_lng is None:
                    continue  # no pickup coordinates to start from either

                remaining_lat = trip.destination_lat - start_lat
                remaining_lng = trip.destination_lng - start_lng

                # Already close enough — leave it at the destination
                if abs(remaining_lat) < ARRIVAL_THRESHOLD and abs(remaining_lng) < ARRIVAL_THRESHOLD:
                    continue

                new_lat = round(start_lat + remaining_lat * STEP_FRACTION, 6)
                new_lng = round(start_lng + remaining_lng * STEP_FRACTION, 6)

                vehicle.current_lat = new_lat
                vehicle.current_lng = new_lng
                db.commit()

                # Global broadcast — same shape the manual vehicle-edit update uses,
                # so the Dashboard's LiveMap picks it up without any changes needed
                await manager.broadcast({
                    "type": "vehicle_location_update",
                    "vehicle_id": vehicle.id,
                    "registration_number": vehicle.registration_number,
                    "current_lat": vehicle.current_lat,
                    "current_lng": vehicle.current_lng,
                    "status": vehicle.status,
                })

                # Trip-specific broadcast — for anyone watching this exact trip
                await manager.broadcast_to_trip(trip.id, {
                    "type": "trip_location_update",
                    "trip_id": trip.id,
                    "vehicle_id": vehicle.id,
                    "current_lat": vehicle.current_lat,
                    "current_lng": vehicle.current_lng,
                })
        finally:
            db.close()