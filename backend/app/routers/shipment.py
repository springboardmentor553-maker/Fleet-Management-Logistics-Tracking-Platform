import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.models.vehicle import Vehicle
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
    vehicle = db.query(Vehicle).filter(Vehicle.id == shipment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Generate a tracking number and map schemas to models
    db_shipment = Shipment(
        tracking_number=f"TRK-{uuid.uuid4().hex[:8].upper()}",
        sender_name="Default Sender",
        receiver_name="Default Receiver",
        pickup_location=shipment.source,
        delivery_location=shipment.destination,
        current_status=ShipmentStatus(shipment.status) if shipment.status in [s.value for s in ShipmentStatus] else ShipmentStatus.CREATED,
        weight=1.0,
        assigned_vehicle_id=shipment.vehicle_id
    )

    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)

    return {
        "id": db_shipment.id,
        "shipment_name": shipment.shipment_name,
        "source": db_shipment.pickup_location,
        "destination": db_shipment.delivery_location,
        "status": db_shipment.current_status.value,
        "vehicle_id": db_shipment.assigned_vehicle_id
    }


@router.get("/", response_model=List[ShipmentResponse])
def fetch_all_shipments(
    db: Session = Depends(get_db)
):
    db_shipments = db.query(Shipment).all()
    return [
        {
            "id": s.id,
            "shipment_name": f"Shipment {s.id}",
            "source": s.pickup_location,
            "destination": s.delivery_location,
            "status": s.current_status.value if hasattr(s.current_status, 'value') else s.current_status,
            "vehicle_id": s.assigned_vehicle_id
        } for s in db_shipments
    ]


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def fetch_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    return {
        "id": db_shipment.id,
        "shipment_name": f"Shipment {db_shipment.id}",
        "source": db_shipment.pickup_location,
        "destination": db_shipment.delivery_location,
        "status": db_shipment.current_status.value if hasattr(db_shipment.current_status, 'value') else db_shipment.current_status,
        "vehicle_id": db_shipment.assigned_vehicle_id
    }


@router.put("/{shipment_id}", response_model=ShipmentResponse)
def edit_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == shipment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_shipment.pickup_location = shipment.source
    db_shipment.delivery_location = shipment.destination
    db_shipment.current_status = ShipmentStatus(shipment.status) if shipment.status in [s.value for s in ShipmentStatus] else ShipmentStatus.CREATED
    db_shipment.assigned_vehicle_id = shipment.vehicle_id

    db.commit()
    db.refresh(db_shipment)

    return {
        "id": db_shipment.id,
        "shipment_name": shipment.shipment_name,
        "source": db_shipment.pickup_location,
        "destination": db_shipment.delivery_location,
        "status": db_shipment.current_status.value if hasattr(db_shipment.current_status, 'value') else db_shipment.current_status,
        "vehicle_id": db_shipment.assigned_vehicle_id
    }


@router.delete("/{shipment_id}")
def remove_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    db.delete(db_shipment)
    db.commit()
    return {"message": "Shipment deleted successfully"}