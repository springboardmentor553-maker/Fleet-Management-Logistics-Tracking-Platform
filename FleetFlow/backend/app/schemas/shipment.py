from pydantic import BaseModel
from datetime import datetime

from app.enums.shipment_status import ShipmentStatus


class ShipmentBase(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: float
    driver_id: int | None = None
    vehicle_id: int | None = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    sender_name: str | None = None
    receiver_name: str | None = None
    pickup_location: str | None = None
    delivery_location: str | None = None
    weight: float | None = None
    current_status: ShipmentStatus | None = None
    driver_id: int | None = None
    vehicle_id: int | None = None


class ShipmentResponse(ShipmentBase):
    id: int
    tracking_number: str
    current_status: ShipmentStatus
    created_at: datetime

    class Config:
        from_attributes = True