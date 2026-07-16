from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.trip import Trip
from backend.app.models.shipment import Shipment
from backend.app.models.driver import Driver
from backend.app.models.vehicle import Vehicle
from backend.app.schemas.trip import TripCreate, TripUpdate
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
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

    # Create new trip
    new_trip = Trip(
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
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
        db_trip.pickup_location = trip_data.pickup_location
    if trip_data.destination is not None:
        db_trip.destination = trip_data.destination
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
