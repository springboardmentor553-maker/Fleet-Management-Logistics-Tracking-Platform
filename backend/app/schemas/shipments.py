from datetime import datetime

from app.schemas.common import ORMModel


class ShipmentBase(ORMModel):

    tracking_number: str

    sender_name: str

    receiver_name: str

    pickup_location: str

    delivery_location: str

    current_status: str = "Pending"

    weight: float | None = None

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ORMModel):

    tracking_number: str | None = None

    sender_name: str | None = None

    receiver_name: str | None = None

    pickup_location: str | None = None

    delivery_location: str | None = None

    current_status: str | None = None

    weight: float | None = None

    assigned_driver_id: int | None = None

    assigned_vehicle_id: int | None = None


class ShipmentRead(ShipmentBase):

    id: int

    created_date: datetime