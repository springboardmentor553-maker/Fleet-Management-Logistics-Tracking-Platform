from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.enums import ShipmentStatus


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


# -----------------------------
# Shipment Tracking Response
# -----------------------------
class ShipmentTrackingResponse(BaseModel):
    tracking_number: str
    current_status: str
    driver_name: str
    vehicle_registration_number: str
    pickup_location: str
    destination: str
    eta: str