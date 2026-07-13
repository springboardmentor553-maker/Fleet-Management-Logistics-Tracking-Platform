from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.trip import TripCreate


def get_all_trips(db: Session):
    return db.query(Trip).order_by(Trip.id).all()


def get_trip(trip_id: int, db: Session):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


def create_trip(data: TripCreate, db: Session):
    shipment = db.query(Shipment).filter(Shipment.id == data.shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=400, detail="Shipment not found")
    if shipment.status != "in_transit":
        raise HTTPException(status_code=400, detail="Shipment must be in_transit to create a trip")

    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=400, detail="Driver not found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle not found")

    trip = Trip(
        shipment_id=data.shipment_id,
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,
        status="scheduled",
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def update_trip_status(trip_id: int, new_status: str, db: Session):
    trip = get_trip(trip_id, db)

    valid_statuses = {"scheduled", "started", "completed", "cancelled"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    if new_status == trip.status:
        return trip

    if new_status == "started":
        if trip.status != "scheduled":
            raise HTTPException(status_code=400, detail="Trip can only be started from scheduled state")
        trip.start_time = datetime.utcnow()

    if new_status == "completed":
        if trip.status != "started":
            raise HTTPException(status_code=400, detail="Trip can only be completed after it has started")
        trip.end_time = datetime.utcnow()
        driver  = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        shipment = db.query(Shipment).filter(Shipment.id == trip.shipment_id).first()
        if driver:   driver.is_available = True
        if vehicle:  vehicle.current_status = "available"
        if shipment:
            shipment.status = "delivered"
            shipment.delivered_at = datetime.utcnow()

    if new_status == "cancelled":
        if trip.status == "completed":
            raise HTTPException(status_code=400, detail="Cannot cancel a completed trip")
        trip.end_time = datetime.utcnow()
        driver  = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        shipment = db.query(Shipment).filter(Shipment.id == trip.shipment_id).first()
        if driver:   driver.is_available = True
        if vehicle:  vehicle.current_status = "available"
        if shipment:
            shipment.status = "cancelled"

    trip.status = new_status
    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(trip_id: int, db: Session):
    trip = get_trip(trip_id, db)
    db.delete(trip)
    db.commit()
