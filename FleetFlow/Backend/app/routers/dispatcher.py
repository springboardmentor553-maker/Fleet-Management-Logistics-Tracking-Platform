from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/dispatcher", tags=["Dispatcher"])

_dispatch_or_admin = require_roles(Role.DISPATCHER, Role.ADMIN)


class ShipmentCreate(BaseModel):
    origin: str
    destination: str
    weight_kg: float


class ShipmentAssign(BaseModel):
    driver_id: int
    vehicle_id: int


class ShipmentResponse(BaseModel):
    id: int
    origin: str
    destination: str
    weight_kg: float
    status: str
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/shipments", response_model=list[ShipmentResponse])
def list_shipments(db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    return db.query(Shipment).all()


@router.post("/shipments", response_model=ShipmentResponse, status_code=201)
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch("/shipments/{shipment_id}/assign", response_model=ShipmentResponse)
def assign_shipment(shipment_id: int, data: ShipmentAssign, db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    driver = db.query(Driver).filter(Driver.id == data.driver_id, Driver.is_available == True).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver not found or unavailable")

    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id, Vehicle.is_available == True).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle not found or unavailable")

    shipment.driver_id = data.driver_id
    shipment.vehicle_id = data.vehicle_id
    shipment.status = "in_transit"
    driver.is_available = False
    vehicle.is_available = False
    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch("/shipments/{shipment_id}/cancel", response_model=ShipmentResponse)
def cancel_shipment(shipment_id: int, db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    if shipment.status == "delivered":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel a delivered shipment")
    shipment.status = "cancelled"
    db.commit()
    db.refresh(shipment)
    return shipment
