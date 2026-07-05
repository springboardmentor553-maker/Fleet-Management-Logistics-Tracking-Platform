from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/driver", tags=["Driver"])

_driver_or_admin = require_roles(Role.DRIVER, Role.ADMIN)


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


@router.get("/my-shipments", response_model=list[ShipmentResponse])
def my_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(_driver_or_admin),
):
    driver = db.query(Driver).filter(Driver.email == current_user.email).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
    return db.query(Shipment).filter(Shipment.driver_id == driver.id).all()


@router.patch("/shipments/{shipment_id}/deliver", response_model=ShipmentResponse)
def mark_delivered(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(_driver_or_admin),
):
    driver = db.query(Driver).filter(Driver.email == current_user.email).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    shipment = db.query(Shipment).filter(Shipment.id == shipment_id, Shipment.driver_id == driver.id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found or not assigned to you")
    if shipment.status != "in_transit":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only in-transit shipments can be marked delivered")

    shipment.status = "delivered"
    shipment.delivered_at = datetime.utcnow()
    driver.is_available = True

    vehicle = shipment.vehicle
    if vehicle:
        vehicle.is_available = True

    db.commit()
    db.refresh(shipment)
    return shipment
