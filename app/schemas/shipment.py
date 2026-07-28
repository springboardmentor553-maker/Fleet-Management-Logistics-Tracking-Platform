from pydantic import BaseModel

from datetime import datetime
from typing import Optional
from app.models.shipment import ShipmentStatus




class ShipmentCreate(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: Optional[float] = None
    status: ShipmentStatus = ShipmentStatus.CREATED

    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None


class ShipmentUpdate(BaseModel):
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None

    weight: Optional[float] = None

    status: Optional[ShipmentStatus] = None
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: Optional[float]
    status: ShipmentStatus = ShipmentStatus.CREATED
    current_location: Optional[str] = None
    delivery_date: datetime | None = None
    delivery_notes: str | None = None
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    class Config:
        from_attributes = True


class ShipmentTrackingUpdate(BaseModel):
    current_location: str
    status: ShipmentStatus = ShipmentStatus.CREATED


class DeliveryConfirmation(BaseModel):
    receiver_name: str
    delivery_date: datetime | None = None
    delivery_notes: str


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus = ShipmentStatus.CREATED