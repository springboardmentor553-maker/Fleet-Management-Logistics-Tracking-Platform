import logging

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.trip import Trip, TripStatus
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.trip import TripCreate, TripUpdate
from app.services.geocoding_service import geocode_location

logger = logging.getLogger("fleetflow.trip_service")

# ---------------------------------------------------------------------------
# FIX: SQLAlchemy 2.0's bind_processor for SQLEnum serialises members by
# their Python name (e.g. 'CREATED') rather than their .value ('Created')
# unless values_callable is set on the column.  As a belt-and-suspenders
# guard we also compare against the raw .value strings here so the WHERE
# clause always sends the correct PostgreSQL labels.
# ---------------------------------------------------------------------------


def _is_active_status():
    """Return an OR clause matching Created, Assigned, or In Transit trips."""
    return or_(
        Trip.trip_status == TripStatus.CREATED.value,
        Trip.trip_status == TripStatus.ASSIGNED.value,
        Trip.trip_status == TripStatus.IN_TRANSIT.value,
    )


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------

def get_all_trips(db: Session):
    trips = db.query(Trip).all()
    logger.info("get_all_trips — returned %d trips", len(trips))
    return trips


def get_trip(trip_id: int, db: Session):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        logger.warning("get_trip — trip %d not found", trip_id)
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def create_trip(trip: TripCreate, db: Session):
    # Verify shipment exists
    shipment = db.query(Shipment).filter(Shipment.id == trip.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Verify driver exists
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Verify vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Verify driver does not already have an active trip
    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == trip.driver_id,
        _is_active_status(),
    ).first()
    if active_driver_trip:
        logger.warning(
            "create_trip — driver %d already has active trip %d",
            trip.driver_id, active_driver_trip.id,
        )
        raise HTTPException(status_code=400, detail="Driver already has an active trip")

    # Verify vehicle does not already have an active trip
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == trip.vehicle_id,
        _is_active_status(),
    ).first()
    if active_vehicle_trip:
        logger.warning(
            "create_trip — vehicle %d already has active trip %d",
            trip.vehicle_id, active_vehicle_trip.id,
        )
        raise HTTPException(status_code=400, detail="Vehicle already has an active trip")

    # Geocode pickup location automatically
    logger.info("create_trip — geocoding pickup_location: %r", trip.pickup_location)
    pickup_coords = geocode_location(trip.pickup_location)

    # Geocode destination automatically
    logger.info("create_trip — geocoding destination: %r", trip.destination)
    destination_coords = geocode_location(trip.destination)

    new_trip = Trip(
        **trip.model_dump(),
        pickup_latitude=pickup_coords["latitude"],
        pickup_longitude=pickup_coords["longitude"],
        destination_latitude=destination_coords["latitude"],
        destination_longitude=destination_coords["longitude"],
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    logger.info(
        "create_trip — created trip id=%d, pickup=(%.6f, %.6f), dest=(%.6f, %.6f)",
        new_trip.id,
        pickup_coords["latitude"], pickup_coords["longitude"],
        destination_coords["latitude"], destination_coords["longitude"],
    )
    return new_trip


def update_trip(trip_id: int, trip_data: TripUpdate, db: Session):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Verify shipment exists
    shipment = db.query(Shipment).filter(Shipment.id == trip_data.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Verify driver exists
    driver = db.query(Driver).filter(Driver.id == trip_data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Verify vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Verify driver does not have another active trip (excluding this one)
    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == trip_data.driver_id,
        _is_active_status(),
        Trip.id != trip_id,
    ).first()
    if active_driver_trip:
        logger.warning(
            "update_trip — driver %d already has active trip %d",
            trip_data.driver_id, active_driver_trip.id,
        )
        raise HTTPException(status_code=400, detail="Driver already has an active trip")

    # Verify vehicle does not have another active trip (excluding this one)
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == trip_data.vehicle_id,
        _is_active_status(),
        Trip.id != trip_id,
    ).first()
    if active_vehicle_trip:
        logger.warning(
            "update_trip — vehicle %d already has active trip %d",
            trip_data.vehicle_id, active_vehicle_trip.id,
        )
        raise HTTPException(status_code=400, detail="Vehicle already has an active trip")

    # Re-geocode if pickup_location changed
    pickup_changed = trip_data.pickup_location != db_trip.pickup_location
    if pickup_changed:
        logger.info(
            "update_trip — pickup_location changed, re-geocoding: %r",
            trip_data.pickup_location,
        )
        pickup_coords = geocode_location(trip_data.pickup_location)
        db_trip.pickup_latitude = pickup_coords["latitude"]
        db_trip.pickup_longitude = pickup_coords["longitude"]

    # Re-geocode if destination changed
    dest_changed = trip_data.destination != db_trip.destination
    if dest_changed:
        logger.info(
            "update_trip — destination changed, re-geocoding: %r",
            trip_data.destination,
        )
        dest_coords = geocode_location(trip_data.destination)
        db_trip.destination_latitude = dest_coords["latitude"]
        db_trip.destination_longitude = dest_coords["longitude"]

    # Apply all scalar fields from the update payload
    for key, value in trip_data.model_dump().items():
        setattr(db_trip, key, value)

    db.commit()
    db.refresh(db_trip)
    logger.info("update_trip — updated trip id=%d", db_trip.id)
    return db_trip


def delete_trip(trip_id: int, db: Session):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        logger.warning("delete_trip — trip %d not found", trip_id)
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(db_trip)
    db.commit()
    logger.info("delete_trip — deleted trip id=%d", trip_id)
    return {"message": "Trip deleted successfully"}
