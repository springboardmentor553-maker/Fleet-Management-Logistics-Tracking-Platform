from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.trip import Trip, TripStatus
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.trip import TripCreate, TripUpdate


def get_all_trips(db: Session):
    return db.query(Trip).all()


def get_trip(trip_id: int, db: Session):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
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

    # Verify Driver does not have an active trip
    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == trip.driver_id,
        Trip.trip_status.in_([TripStatus.CREATED, TripStatus.ASSIGNED, TripStatus.IN_TRANSIT])
    ).first()
    if active_driver_trip:
        raise HTTPException(status_code=400, detail="Driver already has an active trip")

    # Verify Vehicle does not have an active trip
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == trip.vehicle_id,
        Trip.trip_status.in_([TripStatus.CREATED, TripStatus.ASSIGNED, TripStatus.IN_TRANSIT])
    ).first()
    if active_vehicle_trip:
        raise HTTPException(status_code=400, detail="Vehicle already has an active trip")

    new_trip = Trip(**trip.model_dump())
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
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

    # Verify Driver does not have an active trip (excluding current trip)
    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == trip_data.driver_id,
        Trip.trip_status.in_([TripStatus.CREATED, TripStatus.ASSIGNED, TripStatus.IN_TRANSIT]),
        Trip.id != trip_id
    ).first()
    if active_driver_trip:
        raise HTTPException(status_code=400, detail="Driver already has an active trip")

    # Verify Vehicle does not have an active trip (excluding current trip)
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == trip_data.vehicle_id,
        Trip.trip_status.in_([TripStatus.CREATED, TripStatus.ASSIGNED, TripStatus.IN_TRANSIT]),
        Trip.id != trip_id
    ).first()
    if active_vehicle_trip:
        raise HTTPException(status_code=400, detail="Vehicle already has an active trip")

    for key, value in trip_data.model_dump().items():
        setattr(db_trip, key, value)

    db.commit()
    db.refresh(db_trip)
    return db_trip


def delete_trip(trip_id: int, db: Session):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(db_trip)
    db.commit()
    return {"message": "Trip deleted successfully"}
