from datetime import datetime
from pydantic import BaseModel
from app.models.shipment import ShipmentStatus


class ShipmentCreate(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: float | None = None
    assigned_driver_id: int | None = None
    assigned_vehicle_id: int | None = None
    current_status: ShipmentStatus = ShipmentStatus.CREATED


class ShipmentUpdate(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: float | None = None
    assigned_driver_id: int | None = None
    assigned_vehicle_id: int | None = None
    current_status: ShipmentStatus


class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    current_status: ShipmentStatus
    weight: float | None
    created_date: datetime
    assigned_driver_id: int | None
    assigned_vehicle_id: int | None

    class Config:
        from_attributes = True