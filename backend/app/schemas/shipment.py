from datetime import datetime

from pydantic import BaseModel, ConfigDict

# Import the SAME enum used by the model
from app.models.shipment_status import ShipmentStatus


class ShipmentBase(BaseModel):

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


class ShipmentUpdate(BaseModel):

    sender_name: str | None = None

    receiver_name: str | None = None

    pickup_location: str | None = None

    delivery_location: str | None = None

    current_status: ShipmentStatus | None = None

    weight: float | None = None

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None


class ShipmentResponse(ShipmentBase):

    id: int

    created_date: datetime

    model_config = ConfigDict(
        from_attributes=True
    )