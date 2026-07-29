from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, List, Optional

from backend.app.database import get_db
from backend.app.models.trip import Trip
from backend.app.models.shipment import Shipment
from backend.app.models.driver import Driver
from backend.app.models.vehicle import Vehicle
from backend.app.models.shipment_history import ShipmentHistory
from backend.app.schemas.trip import TripCreate, TripUpdate, TripLocationUpdate, TripTrafficUpdate
from backend.app.role_checker import role_required
from backend.app.services.map_service import get_coordinates, get_route

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)

compat_router = APIRouter(
    tags=["Trips Route Compatibility"]
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket):
        if trip_id in self.active_connections:
            if websocket in self.active_connections[trip_id]:
                self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]

    async def broadcast_to_trip(self, trip_id: int, message: dict):
        if trip_id in self.active_connections:
            for connection in list(self.active_connections[trip_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(trip_id, connection)


manager = ConnectionManager()
latest_locations: Dict[int, Dict[str, float]] = {}

# Ensure target columns exist for PostgreSQL/SQLite databases
from sqlalchemy import text
from backend.app.database import engine
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS traffic_level VARCHAR DEFAULT 'Normal';"))
        conn.commit()
    except Exception:
        pass

TRAFFIC_MULTIPLIERS = {
    "Normal": 1.0,
    "Moderate": 1.15,
    "Heavy": 1.35,
    "Severe": 1.60
}


# -------------------- ADD TRIP --------------------

@router.post("/")
def add_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):
    # Check Shipment exists
    shipment = db.query(Shipment).filter(Shipment.id == trip.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment Not Found")

    # Check Driver exists
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver Not Found")

    # Check Vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle Not Found")

    # Validate scheduled times
    if trip.scheduled_start >= trip.scheduled_end:
        raise HTTPException(status_code=400, detail="scheduled_start must be before scheduled_end")

    # Prevent duplicate active shipment trip
    duplicate_shipment = db.query(Trip).filter(
        (Trip.shipment_id == trip.shipment_id) &
        (Trip.status.in_(["Scheduled", "Active"]))
    ).first()
    if duplicate_shipment:
        raise HTTPException(status_code=400, detail="Shipment is already assigned to an active or scheduled trip")

    # Prevent assigning driver to overlapping trip
    overlapping_driver = db.query(Trip).filter(
        (Trip.driver_id == trip.driver_id) &
        (Trip.status.in_(["Scheduled", "Active"])) &
        (Trip.scheduled_start < trip.scheduled_end) &
        (Trip.scheduled_end > trip.scheduled_start)
    ).first()
    if overlapping_driver:
        raise HTTPException(status_code=400, detail="Driver already has an overlapping trip")

    # Prevent assigning vehicle to overlapping trip
    overlapping_vehicle = db.query(Trip).filter(
        (Trip.vehicle_id == trip.vehicle_id) &
        (Trip.status.in_(["Scheduled", "Active"])) &
        (Trip.scheduled_start < trip.scheduled_end) &
        (Trip.scheduled_end > trip.scheduled_start)
    ).first()
    if overlapping_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle already has an overlapping trip")

    # Geocode locations using map service
    pickup_coords = get_coordinates(trip.pickup_location)
    if not pickup_coords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to geocode pickup location: {trip.pickup_location}"
        )
        
    dest_coords = get_coordinates(trip.destination)
    if not dest_coords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to geocode destination: {trip.destination}"
        )

    # Create new trip
    new_status = trip.status or "Scheduled"
    new_trip = Trip(
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
        pickup_latitude=pickup_coords["latitude"],
        pickup_longitude=pickup_coords["longitude"],
        destination_latitude=dest_coords["latitude"],
        destination_longitude=dest_coords["longitude"],
        scheduled_start=trip.scheduled_start,
        scheduled_end=trip.scheduled_end,
        status=new_status
    )

    db.add(new_trip)

    # Update driver and vehicle status
    driver.status = "On Trip"
    vehicle.status = "On Trip"

    # Link shipment status
    if new_status == "Active":
        shipment.status = "In Transit"
        db.add(ShipmentHistory(shipment_id=shipment.id, status="In Transit"))
    elif new_status == "Scheduled":
        shipment.status = "Assigned"
        db.add(ShipmentHistory(shipment_id=shipment.id, status="Assigned"))
    elif new_status == "Completed":
        shipment.status = "Delivered"
        db.add(ShipmentHistory(shipment_id=shipment.id, status="Delivered"))
        driver.status = "Available"
        vehicle.status = "Available"
    elif new_status == "Cancelled":
        shipment.status = "Cancelled"
        db.add(ShipmentHistory(shipment_id=shipment.id, status="Cancelled"))
        driver.status = "Available"
        vehicle.status = "Available"

    db.commit()
    db.refresh(new_trip)

    return {
        "message": "Trip Added Successfully",
        "trip": new_trip
    }


# -------------------- GET ALL --------------------

@router.get("/")
def get_all_trips(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    return db.query(Trip).all()


# -------------------- GET ONE --------------------

@router.get("/{trip_id}")
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {"message": "Trip Not Found"}
    return trip


# -------------------- UPDATE --------------------

@router.put("/{trip_id}")
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip Not Found")

    # Resolve values with fallbacks
    shipment_id = trip_data.shipment_id if trip_data.shipment_id is not None else db_trip.shipment_id
    driver_id = trip_data.driver_id if trip_data.driver_id is not None else db_trip.driver_id
    vehicle_id = trip_data.vehicle_id if trip_data.vehicle_id is not None else db_trip.vehicle_id
    target_status = trip_data.status if trip_data.status is not None else db_trip.status
    scheduled_start = trip_data.scheduled_start if trip_data.scheduled_start is not None else db_trip.scheduled_start
    scheduled_end = trip_data.scheduled_end if trip_data.scheduled_end is not None else db_trip.scheduled_end

    # Check existence
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if trip_data.shipment_id is not None and not shipment:
        raise HTTPException(status_code=404, detail="Shipment Not Found")

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if trip_data.driver_id is not None and not driver:
        raise HTTPException(status_code=404, detail="Driver Not Found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if trip_data.vehicle_id is not None and not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle Not Found")

    # Validate sched start < sched end
    if scheduled_start >= scheduled_end:
        raise HTTPException(status_code=400, detail="scheduled_start must be before scheduled_end")

    # Only check overlaps if trip is active or scheduled
    if target_status in ["Scheduled", "Active"]:
        # Prevent duplicate active shipment trip
        duplicate_shipment = db.query(Trip).filter(
            (Trip.id != trip_id) &
            (Trip.shipment_id == shipment_id) &
            (Trip.status.in_(["Scheduled", "Active"]))
        ).first()
        if duplicate_shipment:
            raise HTTPException(status_code=400, detail="Shipment is already assigned to an active or scheduled trip")

        # Prevent assigning driver to overlapping trip
        overlapping_driver = db.query(Trip).filter(
            (Trip.id != trip_id) &
            (Trip.driver_id == driver_id) &
            (Trip.status.in_(["Scheduled", "Active"])) &
            (Trip.scheduled_start < scheduled_end) &
            (Trip.scheduled_end > scheduled_start)
        ).first()
        if overlapping_driver:
            raise HTTPException(status_code=400, detail="Driver already has an overlapping trip")

        # Prevent assigning vehicle to overlapping trip
        overlapping_vehicle = db.query(Trip).filter(
            (Trip.id != trip_id) &
            (Trip.vehicle_id == vehicle_id) &
            (Trip.status.in_(["Scheduled", "Active"])) &
            (Trip.scheduled_start < scheduled_end) &
            (Trip.scheduled_end > scheduled_start)
        ).first()
        if overlapping_vehicle:
            raise HTTPException(status_code=400, detail="Vehicle already has an overlapping trip")

    # Transition validation
    if trip_data.status is not None:
        allowed_trip_statuses = {"Scheduled", "Active", "Completed", "Cancelled"}
        if target_status not in allowed_trip_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid trip status: {target_status}")

        current_status = db_trip.status
        if current_status != target_status:
            # Block transition from completed or cancelled
            if current_status in ("Completed", "Cancelled"):
                raise HTTPException(status_code=400, detail=f"Cannot transition trip from terminal state '{current_status}'")
            
            # Prevent invalid transitions
            valid_trip_transitions = {
                "Scheduled": {"Active", "Cancelled"},
                "Active": {"Completed", "Cancelled"},
            }
            allowed_targets = valid_trip_transitions.get(current_status, set())
            if target_status not in allowed_targets:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid transition from '{current_status}' to '{target_status}'"
                )

            # Retrieve objects to sync statuses
            curr_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
            curr_driver = db.query(Driver).filter(Driver.id == driver_id).first()
            curr_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

            # Apply state updates to shipment, driver, vehicle
            if target_status == "Active":
                if curr_shipment:
                    curr_shipment.status = "In Transit"
                    db.add(ShipmentHistory(shipment_id=curr_shipment.id, status="In Transit"))
            elif target_status == "Completed":
                if curr_shipment:
                    curr_shipment.status = "Delivered"
                    db.add(ShipmentHistory(shipment_id=curr_shipment.id, status="Delivered"))
                if curr_driver:
                    curr_driver.status = "Available"
                if curr_vehicle:
                    curr_vehicle.status = "Available"
            elif target_status == "Cancelled":
                if curr_shipment:
                    curr_shipment.status = "Cancelled"
                    db.add(ShipmentHistory(shipment_id=curr_shipment.id, status="Cancelled"))
                if curr_driver:
                    curr_driver.status = "Available"
                if curr_vehicle:
                    curr_vehicle.status = "Available"
            elif target_status == "Scheduled":
                if curr_shipment:
                    curr_shipment.status = "Assigned"
                    db.add(ShipmentHistory(shipment_id=curr_shipment.id, status="Assigned"))

    # Apply updates
    if trip_data.shipment_id is not None:
        db_trip.shipment_id = trip_data.shipment_id
    if trip_data.driver_id is not None:
        db_trip.driver_id = trip_data.driver_id
    if trip_data.vehicle_id is not None:
        db_trip.vehicle_id = trip_data.vehicle_id

    if trip_data.pickup_location is not None:
        if trip_data.pickup_location != db_trip.pickup_location:
            pickup_coords = get_coordinates(trip_data.pickup_location)
            if not pickup_coords:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to geocode updated pickup location: {trip_data.pickup_location}"
                )
            db_trip.pickup_location = trip_data.pickup_location
            db_trip.pickup_latitude = pickup_coords["latitude"]
            db_trip.pickup_longitude = pickup_coords["longitude"]

    if trip_data.destination is not None:
        if trip_data.destination != db_trip.destination:
            dest_coords = get_coordinates(trip_data.destination)
            if not dest_coords:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to geocode updated destination: {trip_data.destination}"
                )
            db_trip.destination = trip_data.destination
            db_trip.destination_latitude = dest_coords["latitude"]
            db_trip.destination_longitude = dest_coords["longitude"]

    if trip_data.scheduled_start is not None:
        db_trip.scheduled_start = trip_data.scheduled_start
    if trip_data.scheduled_end is not None:
        db_trip.scheduled_end = trip_data.scheduled_end
    if trip_data.status is not None:
        db_trip.status = trip_data.status

    db.commit()
    db.refresh(db_trip)

    return {
        "message": "Trip Updated Successfully",
        "trip": db_trip
    }


# -------------------- DELETE --------------------

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin"]))
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {"message": "Trip Not Found"}

    db.delete(trip)
    db.commit()

    return {"message": "Trip Deleted Successfully"}


# -------------------- ROUTE API --------------------

def get_trip_route_logic(trip_id: int, db: Session):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip Not Found"
        )

    # Resolve coordinates if they are missing (for legacy trips)
    if (db_trip.pickup_latitude is None or db_trip.pickup_longitude is None or
        db_trip.destination_latitude is None or db_trip.destination_longitude is None):
        pickup_coords = get_coordinates(db_trip.pickup_location)
        dest_coords = get_coordinates(db_trip.destination)
        if not pickup_coords or not dest_coords:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip coordinates are missing and locations could not be geocoded."
            )
        db_trip.pickup_latitude = pickup_coords["latitude"]
        db_trip.pickup_longitude = pickup_coords["longitude"]
        db_trip.destination_latitude = dest_coords["latitude"]
        db_trip.destination_longitude = dest_coords["longitude"]
        db.commit()
        db.refresh(db_trip)

    route_data = get_route(
        db_trip.pickup_latitude,
        db_trip.pickup_longitude,
        db_trip.destination_latitude,
        db_trip.destination_longitude
    )

    if not route_data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate driving route from OSRM."
        )

    return {
        "trip_id": db_trip.id,
        "pickup_location": db_trip.pickup_location,
        "destination": db_trip.destination,
        "pickup_coordinates": {
            "latitude": db_trip.pickup_latitude,
            "longitude": db_trip.pickup_longitude
        },
        "destination_coordinates": {
            "latitude": db_trip.destination_latitude,
            "longitude": db_trip.destination_longitude
        },
        "distance": route_data["distance"],
        "estimated_duration": route_data["duration"],
        "route_geometry": route_data["geometry"],
        "summary": route_data["summary"] or f"{db_trip.pickup_location} to {db_trip.destination}"
    }


@router.get("/{trip_id}/route")
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    return get_trip_route_logic(trip_id, db)


# Reusable ETA calculation logic
from datetime import timedelta

def calculate_eta_logic(trip: Trip, db: Session, traffic_level: str = None):
    if trip.status == "Completed":
        raise HTTPException(status_code=400, detail="Trip has already completed")
    if trip.status == "Cancelled":
        raise HTTPException(status_code=400, detail="ETA is unavailable for cancelled trips")

    active_traffic = traffic_level or trip.traffic_level or "Normal"
    if active_traffic not in TRAFFIC_MULTIPLIERS:
        active_traffic = "Normal"
    factor = TRAFFIC_MULTIPLIERS[active_traffic]

    lat = None
    lon = None
    loc_info = latest_locations.get(trip.id)
    if loc_info:
        lat = loc_info["latitude"]
        lon = loc_info["longitude"]
    else:
        if trip.pickup_latitude is not None and trip.pickup_longitude is not None:
            lat = trip.pickup_latitude
            lon = trip.pickup_longitude
        else:
            coords = get_coordinates(trip.pickup_location)
            if coords:
                lat = coords["latitude"]
                lon = coords["longitude"]
                trip.pickup_latitude = lat
                trip.pickup_longitude = lon
                db.commit()

    dest_lat = trip.destination_latitude
    dest_lon = trip.destination_longitude
    if dest_lat is None or dest_lon is None:
        coords = get_coordinates(trip.destination)
        if coords:
            dest_lat = coords["latitude"]
            dest_lon = coords["longitude"]
            trip.destination_latitude = dest_lat
            trip.destination_longitude = dest_lon
            db.commit()

    if lat is None or lon is None or dest_lat is None or dest_lon is None:
        raise HTTPException(status_code=400, detail="Unable to resolve coordinates for ETA calculation")

    # Get route from OSRM
    route_info = get_route(lat, lon, dest_lat, dest_lon)
    if not route_info:
        raise HTTPException(status_code=502, detail="Failed to calculate route from OSRM")

    distance_m = route_info["distance"]
    duration_s = route_info["duration"]

    remaining_distance_km = round(distance_m / 1000.0, 1)
    osrm_duration_minutes = int(duration_s / 60.0)

    traffic_adjusted_seconds = duration_s * factor
    traffic_adjusted_duration_minutes = int(traffic_adjusted_seconds / 60.0)
    estimated_arrival_time = datetime.utcnow() + timedelta(seconds=traffic_adjusted_seconds)

    return {
        "trip_id": trip.id,
        "current_latitude": lat,
        "current_longitude": lon,
        "destination_latitude": dest_lat,
        "destination_longitude": dest_lon,
        "remaining_distance_km": remaining_distance_km,
        "osrm_duration_minutes": osrm_duration_minutes,
        "traffic_level": active_traffic,
        "traffic_factor": factor,
        "traffic_adjusted_duration_minutes": traffic_adjusted_duration_minutes,
        "estimated_arrival_time": estimated_arrival_time.isoformat(),
        "calculation_method": "OSRM + traffic adjustment"
    }


@router.get("/{trip_id}/eta")
def get_trip_eta(
    trip_id: int,
    traffic_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip Not Found")
    return calculate_eta_logic(trip, db, traffic_level)


@router.put("/{trip_id}/traffic")
async def update_trip_traffic(
    trip_id: int,
    payload: TripTrafficUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip Not Found")

    if payload.traffic_level not in TRAFFIC_MULTIPLIERS:
        raise HTTPException(status_code=400, detail="Invalid traffic level")

    trip.traffic_level = payload.traffic_level
    db.commit()
    db.refresh(trip)

    # Recalculate ETA and broadcast update to WebSocket clients immediately
    update_msg = {
        "trip_id": trip.id,
        "status": trip.status,
        "traffic_level": trip.traffic_level,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Fetch latest location if any to append traffic-adjusted ETA details
    loc_info = latest_locations.get(trip_id)
    if loc_info:
        update_msg["latitude"] = loc_info["latitude"]
        update_msg["longitude"] = loc_info["longitude"]
        try:
            eta_res = calculate_eta_logic(trip, db)
            update_msg["eta"] = {
                "remaining_distance_km": eta_res["remaining_distance_km"],
                "osrm_duration_minutes": eta_res["osrm_duration_minutes"],
                "traffic_level": eta_res["traffic_level"],
                "traffic_factor": eta_res["traffic_factor"],
                "traffic_adjusted_duration_minutes": eta_res["traffic_adjusted_duration_minutes"],
                "estimated_arrival_time": eta_res["estimated_arrival_time"]
            }
        except Exception:
            pass

    await manager.broadcast_to_trip(trip_id, update_msg)

    return {"message": "Traffic level updated successfully", "traffic_level": trip.traffic_level}


@router.put("/{trip_id}/location")
async def update_trip_location(
    trip_id: int,
    location: TripLocationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Driver"]))
):
    # Verify Trip exists
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip Not Found")

    # Validate coordinates
    if not (-90.0 <= location.latitude <= 90.0):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180.0 <= location.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")

    # Validate Trip is not Completed or Cancelled
    if trip.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot update location for a completed or cancelled trip")

    # Save to in-memory store
    latest_locations[trip_id] = {
        "latitude": location.latitude,
        "longitude": location.longitude
    }

    # Recalculate ETA
    eta_payload = None
    try:
        eta_res = calculate_eta_logic(trip, db)
        eta_payload = {
            "remaining_distance_km": eta_res["remaining_distance_km"],
            "osrm_duration_minutes": eta_res["osrm_duration_minutes"],
            "traffic_level": eta_res["traffic_level"],
            "traffic_factor": eta_res["traffic_factor"],
            "traffic_adjusted_duration_minutes": eta_res["traffic_adjusted_duration_minutes"],
            "estimated_arrival_time": eta_res["estimated_arrival_time"]
        }
    except Exception as e:
        # Avoid failing location update if OSRM is momentarily down, but print it
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error recalculating ETA during location update: {e}")

    # Broadcast location update via WebSocket
    update_msg = {
        "trip_id": trip_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "status": trip.status,
        "timestamp": datetime.utcnow().isoformat(),
        "traffic_level": trip.traffic_level or "Normal",
        "eta": eta_payload
    }
    await manager.broadcast_to_trip(trip_id, update_msg)

    return {
        "message": "Location updated and broadcasted successfully",
        "data": update_msg
    }


@compat_router.websocket("/ws/trips/{trip_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    trip_id: int,
    token: str = None
):
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        # Verify Trip exists
        db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not db_trip:
            await websocket.close(code=4004, reason="Trip Not Found")
            return

        # Verify connection token parameter
        if not token:
            await websocket.close(code=4001, reason="Missing authentication token")
            return

        # Authenticate token using verify_token
        from backend.app.utils.jwt_handler import verify_token
        payload = verify_token(token)
        if not payload:
            await websocket.close(code=4003, reason="Invalid authentication token")
            return

        # Authorized roles check
        user_role = payload.get("role")
        user_id = payload.get("id")

        if user_role not in ["Admin", "Fleet Manager", "Dispatcher"]:
            if user_role == "Driver":
                if db_trip.driver_id != user_id:
                    await websocket.close(code=4003, reason="Unauthorized to access this trip")
                    return
            else:
                await websocket.close(code=4003, reason="Unauthorized role")
                return

        await websocket.accept()
        await manager.connect(trip_id, websocket)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(trip_id, websocket)
        except Exception:
            manager.disconnect(trip_id, websocket)
    finally:
        db.close()


@compat_router.get("/trip/{trip_id}/route")
def get_trip_route_compat(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    return get_trip_route_logic(trip_id, db)
