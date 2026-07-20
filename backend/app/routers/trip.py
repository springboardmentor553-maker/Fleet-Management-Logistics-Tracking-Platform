from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
)

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)

# ==========================================================
# CREATE TRIP
# ==========================================================

@router.post(
    "/",
    response_model=TripResponse,
    status_code=201
)
def create_trip(
    trip: TripCreate,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------------
    # Validate Shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == trip.shipment_id)
        .first()
    )

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # ------------------------------------------------------
    # Validate Driver
    # ------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # ------------------------------------------------------
    # Validate Vehicle
    # ------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # ------------------------------------------------------
    # Prevent Duplicate Driver Assignment
    # ------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
            Trip.trip_status.in_(["Scheduled", "In Progress"])
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned to an active trip."
        )

    # ------------------------------------------------------
    # Prevent Duplicate Vehicle Assignment
    # ------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
            Trip.trip_status.in_(["Scheduled", "In Progress"])
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is already assigned to an active trip."
        )

    # ------------------------------------------------------
    # Create Trip
    # ------------------------------------------------------

    new_trip = Trip(

        shipment_id=trip.shipment_id,

        driver_id=trip.driver_id,

        vehicle_id=trip.vehicle_id,

        pickup_location=trip.pickup_location,

        destination=trip.destination,

        # ==============================
        # Google Maps Coordinates
        # ==============================

        pickup_latitude=trip.pickup_latitude,

        pickup_longitude=trip.pickup_longitude,

        destination_latitude=trip.destination_latitude,

        destination_longitude=trip.destination_longitude,

        # ==============================

        scheduled_start_time=trip.scheduled_start_time,

        scheduled_end_time=trip.scheduled_end_time,

        trip_status=trip.trip_status

    )

    db.add(new_trip)

    db.commit()

    db.refresh(new_trip)

    return new_trip

# ==========================================================
# GET ALL TRIPS
# ==========================================================

@router.get(
    "/",
    response_model=list[TripResponse]
)
def get_all_trips(
    db: Session = Depends(get_db)
):

    return db.query(Trip).all()


# ==========================================================
# GET TRIP BY ID
# ==========================================================

@router.get(
    "/{trip_id}",
    response_model=TripResponse
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return trip


# ==========================================================
# UPDATE TRIP
# ==========================================================

@router.put(
    "/{trip_id}",
    response_model=TripResponse
)
def update_trip(
    trip_id: int,
    trip: TripUpdate,
    db: Session = Depends(get_db)
):

    db_trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if db_trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # ------------------------------------------------------
    # Validate Shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == trip.shipment_id)
        .first()
    )

    if shipment is None:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # ------------------------------------------------------
    # Validate Driver
    # ------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )

    if driver is None:

        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # ------------------------------------------------------
    # Validate Vehicle
    # ------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )

    if vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # ------------------------------------------------------
    # Prevent Duplicate Driver Assignment
    # ------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
            Trip.trip_status.in_(["Scheduled", "In Progress"]),
            Trip.id != trip_id
        )
        .first()
    )

    if active_driver_trip:

        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned to another active trip."
        )

    # ------------------------------------------------------
    # Prevent Duplicate Vehicle Assignment
    # ------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
            Trip.trip_status.in_(["Scheduled", "In Progress"]),
            Trip.id != trip_id
        )
        .first()
    )

    if active_vehicle_trip:

        raise HTTPException(
            status_code=400,
            detail="Vehicle is already assigned to another active trip."
        )

    # ------------------------------------------------------
    # Update Trip
    # ------------------------------------------------------

    db_trip.shipment_id = trip.shipment_id

    db_trip.driver_id = trip.driver_id

    db_trip.vehicle_id = trip.vehicle_id

    db_trip.pickup_location = trip.pickup_location

    db_trip.destination = trip.destination

    # ======================================================
    # Google Maps Coordinates
    # ======================================================

    db_trip.pickup_latitude = trip.pickup_latitude

    db_trip.pickup_longitude = trip.pickup_longitude

    db_trip.destination_latitude = trip.destination_latitude

    db_trip.destination_longitude = trip.destination_longitude

    # ======================================================

    db_trip.scheduled_start_time = trip.scheduled_start_time

    db_trip.scheduled_end_time = trip.scheduled_end_time

    db_trip.trip_status = trip.trip_status

    db.commit()

    db.refresh(db_trip)

    return db_trip
# ==========================================================
# DELETE TRIP
# ==========================================================

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    db.delete(trip)

    db.commit()

    return {
        "message": "Trip deleted successfully"
    }