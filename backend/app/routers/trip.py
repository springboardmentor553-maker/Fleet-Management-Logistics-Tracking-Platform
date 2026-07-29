from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.trip import Trip
from backend.app.models.shipment import Shipment
from backend.app.models.driver import Driver
from backend.app.models.vehicle import Vehicle
from backend.app.schemas.trip import TripCreate, TripUpdate
from backend.app.role_checker import role_required
from backend.app.services.map_service import get_coordinates, get_route

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)

compat_router = APIRouter(
    tags=["Trips Route Compatibility"]
)


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
        return {"message": "Shipment Not Found"}

    # Check Driver exists
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not driver:
        return {"message": "Driver Not Found"}

    # Check Vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        return {"message": "Vehicle Not Found"}

    # Prevent duplicate active trips
    active_statuses = ["Scheduled", "Active"]
    duplicate_trip = db.query(Trip).filter(
        (Trip.status.in_(active_statuses)) &
        (
            (Trip.shipment_id == trip.shipment_id) |
            (Trip.driver_id == trip.driver_id) |
            (Trip.vehicle_id == trip.vehicle_id)
        )
    ).first()

    if duplicate_trip:
        return {"message": "Duplicate active trip found for this shipment, driver, or vehicle"}

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
        status=trip.status or "Scheduled"
    )

    db.add(new_trip)
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
        return {"message": "Trip Not Found"}

    # If updating shipment_id, driver_id, or vehicle_id, validate existence and check active duplicates
    shipment_id = trip_data.shipment_id if trip_data.shipment_id is not None else db_trip.shipment_id
    driver_id = trip_data.driver_id if trip_data.driver_id is not None else db_trip.driver_id
    vehicle_id = trip_data.vehicle_id if trip_data.vehicle_id is not None else db_trip.vehicle_id
    status = trip_data.status if trip_data.status is not None else db_trip.status

    if trip_data.shipment_id is not None:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            return {"message": "Shipment Not Found"}

    if trip_data.driver_id is not None:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return {"message": "Driver Not Found"}

    if trip_data.vehicle_id is not None:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            return {"message": "Vehicle Not Found"}

    # Only check duplicates if status is active or we are setting it to active
    active_statuses = ["Scheduled", "Active"]
    if status in active_statuses:
        duplicate_trip = db.query(Trip).filter(
            (Trip.id != trip_id) &
            (Trip.status.in_(active_statuses)) &
            (
                (Trip.shipment_id == shipment_id) |
                (Trip.driver_id == driver_id) |
                (Trip.vehicle_id == vehicle_id)
            )
        ).first()

        if duplicate_trip:
            return {"message": "Duplicate active trip found for this shipment, driver, or vehicle"}

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


@compat_router.get("/trip/{trip_id}/route")
def get_trip_route_compat(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    return get_trip_route_logic(trip_id, db)
