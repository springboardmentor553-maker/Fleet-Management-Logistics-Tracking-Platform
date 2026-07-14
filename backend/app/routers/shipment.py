from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)

router = APIRouter(
    prefix="/shipments",
    tags=["Shipment Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def add_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db)
):
    if shipment.assigned_vehicle_id is not None:
        vehicle = db.query(Vehicle).filter(Vehicle.id == shipment.assigned_vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

    if shipment.assigned_driver_id is not None:
        driver = db.query(Driver).filter(Driver.id == shipment.assigned_driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

    # Generate a unique tracking number sequentially (e.g., FLT100001, FLT100002, ...)
    last_shipment = db.query(Shipment).filter(Shipment.tracking_number.like("FLT%")).order_by(Shipment.id.desc()).first()
    if last_shipment and last_shipment.tracking_number:
        try:
            num_part = int(last_shipment.tracking_number[3:])
            new_tracking = f"FLT{num_part + 1:06d}"
        except (ValueError, TypeError):
            new_tracking = "FLT100001"
    else:
        new_tracking = "FLT100001"

    db_shipment = Shipment(
        tracking_number=new_tracking,
        sender_name=shipment.sender_name,
        receiver_name=shipment.receiver_name,
        pickup_location=shipment.pickup_location,
        delivery_location=shipment.delivery_location,
        current_status=shipment.current_status,
        weight=shipment.weight,
        assigned_driver_id=shipment.assigned_driver_id,
        assigned_vehicle_id=shipment.assigned_vehicle_id
    )

    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)

    return db_shipment


@router.get("/", response_model=List[ShipmentResponse])
def fetch_all_shipments(
    db: Session = Depends(get_db)
):
    return db.query(Shipment).all()


@router.get("/{id}", response_model=ShipmentResponse)
def fetch_shipment(
    id: int,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return db_shipment


@router.put("/{id}", response_model=ShipmentResponse)
def edit_shipment(
    id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    if shipment.assigned_vehicle_id is not None:
        vehicle = db.query(Vehicle).filter(Vehicle.id == shipment.assigned_vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

    if shipment.assigned_driver_id is not None:
        driver = db.query(Driver).filter(Driver.id == shipment.assigned_driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

    db_shipment.sender_name = shipment.sender_name
    db_shipment.receiver_name = shipment.receiver_name
    db_shipment.pickup_location = shipment.pickup_location
    db_shipment.delivery_location = shipment.delivery_location
    db_shipment.current_status = shipment.current_status
    db_shipment.weight = shipment.weight
    db_shipment.assigned_driver_id = shipment.assigned_driver_id
    db_shipment.assigned_vehicle_id = shipment.assigned_vehicle_id

    db.commit()
    db.refresh(db_shipment)

    return db_shipment


@router.delete("/{id}")
def remove_shipment(
    id: int,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    db.delete(db_shipment)
    db.commit()
    return {"message": "Shipment deleted successfully"}