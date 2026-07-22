from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.trip import TripCreate, TripUpdate

from app.services.notification_service import create_notification


ACTIVE_STATUSES = ["Scheduled", "In Progress"]


# Create Trip


def create_trip(trip: TripCreate, db: Session):

    shipment = db.query(Shipment).filter(Shipment.id == trip.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    existing_shipment_trip = (
        db.query(Trip)
        .filter(Trip.shipment_id == trip.shipment_id)
        .first()
    )
    if existing_shipment_trip:
        raise HTTPException(
            status_code=400,
            detail="Shipment is already assigned to a trip."
        )

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
            Trip.status.in_(ACTIVE_STATUSES)
        )
        .first()
    )
    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip."
        )

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
            Trip.status.in_(ACTIVE_STATUSES)
        )
        .first()
    )
    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip."
        )

    new_trip = Trip(**trip.model_dump())

    db.add(new_trip)

    create_notification(
        db=db,
        title="New Trip Created",
        message=f"Trip for shipment #{trip.shipment_id} has been scheduled.",
        type="success"
    )

    db.commit()
    db.refresh(new_trip)

    return new_trip



# Get All Trips


def get_all_trips(db: Session):
    return db.query(Trip).all()



# Get Single Trip


def get_trip(trip_id: int, db: Session):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip



# Update Trip


def update_trip(trip_id: int, trip: TripUpdate, db: Session):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.driver_id != db_trip.driver_id:
        active_driver_trip = (
            db.query(Trip)
            .filter(
                Trip.driver_id == trip.driver_id,
                Trip.status.in_(ACTIVE_STATUSES),
                Trip.id != trip_id
            )
            .first()
        )
        if active_driver_trip:
            raise HTTPException(
                status_code=400,
                detail="Driver already has an active trip."
            )

    if trip.vehicle_id != db_trip.vehicle_id:
        active_vehicle_trip = (
            db.query(Trip)
            .filter(
                Trip.vehicle_id == trip.vehicle_id,
                Trip.status.in_(ACTIVE_STATUSES),
                Trip.id != trip_id
            )
            .first()
        )
        if active_vehicle_trip:
            raise HTTPException(
                status_code=400,
                detail="Vehicle already has an active trip."
            )

    for key, value in trip.model_dump().items():
        setattr(db_trip, key, value)

    create_notification(
        db=db,
        title="Trip Updated",
        message=f"Trip #{trip_id} has been updated.",
        type="info"
    )

    db.commit()
    db.refresh(db_trip)

    return db_trip



# Delete Trip


def delete_trip(trip_id: int, db: Session):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    create_notification(
        db=db,
        title="Trip Deleted",
        message=f"Trip #{trip_id} has been deleted.",
        type="warning"
    )

    db.delete(trip)
    db.commit()

    return {"message": "Trip deleted successfully"}