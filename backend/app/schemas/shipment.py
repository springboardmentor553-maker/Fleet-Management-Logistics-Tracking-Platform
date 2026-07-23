from datetime import datetime
from typing import Optional
from app.enums import ShipmentStatus

from pydantic import BaseModel


class ShipmentBase(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    status: ShipmentStatus
    weight: float
    assigned_driver_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ShipmentBase):
    pass


class ShipmentResponse(ShipmentBase):
    id: int
    tracking_number: str
    created_date: datetime

    class Config:
        from_attributes = True