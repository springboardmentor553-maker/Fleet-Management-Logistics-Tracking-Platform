from pydantic import BaseModel
from enum import Enum

class ShipmentStatus(str, Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    PICKED_UP = "Picked Up"
    IN_TRANSIT = "In Transit"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"
    DELAYED = "Delayed"
    CANCELLED = "Cancelled"

class ShipmentCreate(BaseModel):
    tracking_id: str
    sender_name: str
    receiver_name: str
    origin: str
    destination: str
    current_location: str = "Warehouse"
    status: ShipmentStatus = ShipmentStatus.CREATED


class ShipmentUpdate(BaseModel):
    tracking_id: str | None = None
    sender_name: str | None = None
    receiver_name: str | None = None
    origin: str | None = None
    destination: str | None = None
    current_location: str | None = None
    status: ShipmentStatus | None = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_id: str
    sender_name: str
    receiver_name: str
    origin: str
    destination: str
    current_location: str
    status: ShipmentStatus

    class Config:
        from_attributes = True