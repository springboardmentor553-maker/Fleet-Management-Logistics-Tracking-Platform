from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ShipmentStatus(str, Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    IN_TRANSIT = "In Transit"
    DELAYED = "Delayed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class ShipmentBase(BaseModel):

    # Tracking Number will be generated automatically
    tracking_number: str | None = None

    sender_name: str

    receiver_name: str

    pickup_location: str

    delivery_location: str

    current_status: ShipmentStatus = ShipmentStatus.CREATED

    weight: float

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ShipmentBase):
    pass


class ShipmentResponse(ShipmentBase):

    id: int

    created_date: datetime

    model_config = ConfigDict(
        from_attributes=True
    )