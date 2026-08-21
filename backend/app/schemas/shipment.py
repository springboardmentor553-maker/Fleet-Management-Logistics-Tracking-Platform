from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class ShipmentStatus(str, Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    PICKED_UP = "Picked Up"
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"


class ShipmentBase(BaseModel):
    tracking_id: str
    sender_name: str
    receiver_name: str
    origin: str
    destination: str
    current_location: str = "Warehouse"
    status: ShipmentStatus = ShipmentStatus.CREATED


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    tracking_id: str | None = None
    sender_name: str | None = None
    receiver_name: str | None = None
    origin: str | None = None
    destination: str | None = None
    current_location: str | None = None
    status: ShipmentStatus | None = None


class ShipmentResponse(ShipmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True