from datetime import datetime

from pydantic import BaseModel

from app.models.shipment import ShipmentStatus


class ShipmentCreate(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: float | None = None
    status: ShipmentStatus = ShipmentStatus.CREATED

    driver_id: int | None = None
    vehicle_id: int | None = None


class ShipmentUpdate(BaseModel):
    sender_name: str | None = None
    receiver_name: str | None = None

    pickup_location: str | None = None
    delivery_location: str | None = None

    weight: float | None = None

    status: ShipmentStatus | None = None
    driver_id: int | None = None
    vehicle_id: int | None = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: float | None
    status: ShipmentStatus = ShipmentStatus.CREATED
    current_location: str | None = None
    delivery_date: datetime | None = None
    delivery_notes: str | None = None
    driver_id: int | None
    vehicle_id: int | None
    class Config:
        from_attributes = True


class ShipmentTrackingUpdate(BaseModel):
    current_location: str
    status: ShipmentStatus = ShipmentStatus.CREATED


class DeliveryConfirmation(BaseModel):
    receiver_name: str
    delivery_date: datetime | None = None
    delivery_notes: str


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus = ShipmentStatus.CREATED