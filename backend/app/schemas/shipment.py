from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


# ==========================================================
# SHIPMENT STATUS
# ==========================================================

class ShipmentStatus(str, Enum):

    CREATED = "Created"

    ASSIGNED = "Assigned"

    PICKED_UP = "Picked Up"

    IN_TRANSIT = "In Transit"

    OUT_FOR_DELIVERY = "Out for Delivery"

    DELIVERED = "Delivered"

    DELAYED = "Delayed"

    CANCELLED = "Cancelled"


# ==========================================================
# CREATE SHIPMENT
# ==========================================================

class ShipmentCreate(BaseModel):

    sender_name: str

    receiver_name: str

    pickup_location: str

    delivery_location: str

    current_status: ShipmentStatus = (
        ShipmentStatus.CREATED
    )

    weight: float

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None


# ==========================================================
# UPDATE SHIPMENT
# ==========================================================

class ShipmentUpdate(BaseModel):

    sender_name: str | None = None

    receiver_name: str | None = None

    pickup_location: str | None = None

    delivery_location: str | None = None

    current_status: ShipmentStatus | None = None

    weight: float | None = None

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None

    # Accepted for compatibility,
    # but router does not allow changing it.
    tracking_number: str | None = None


# ==========================================================
# RESPONSE
# ==========================================================

class ShipmentResponse(BaseModel):

    id: int

    tracking_number: str

    sender_name: str

    receiver_name: str

    pickup_location: str

    delivery_location: str

    current_status: ShipmentStatus

    weight: float | None = None

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None

    created_date: datetime

    model_config = ConfigDict(
        from_attributes=True
    )