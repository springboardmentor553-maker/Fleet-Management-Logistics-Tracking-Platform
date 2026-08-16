"""Pydantic schemas for Shipment endpoints (Milestone 2 – Task 1 & 3)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.core import ShipmentStatusEnum


class ShipmentCreate(BaseModel):
    """Fields required when creating a new shipment.
    
    tracking_number is intentionally excluded here – it is auto-generated
    by the service layer (FLT100001, FLT100002, …).
    """

    sender_name: str = Field(min_length=1, examples=["Alice Corp"])
    receiver_name: str = Field(min_length=1, examples=["Bob Ltd"])
    pickup_location: str = Field(min_length=1, examples=["Mumbai, MH"])
    delivery_location: str = Field(min_length=1, examples=["Delhi, DL"])
    weight: float = Field(gt=0, description="Weight of cargo in kg", examples=[25.5])
    driver_id: int | None = Field(default=None, description="Assigned driver (optional)")
    vehicle_id: int | None = Field(default=None, description="Assigned vehicle (optional)")
    eta: datetime | None = Field(default=None, description="Estimated time of arrival")
    status: ShipmentStatusEnum = Field(
        default=ShipmentStatusEnum.CREATED,
        description="Initial status; defaults to CREATED",
    )


class ShipmentUpdate(BaseModel):
    """All fields are optional – send only what you want to change."""

    sender_name: str | None = None
    receiver_name: str | None = None
    pickup_location: str | None = None
    delivery_location: str | None = None
    weight: float | None = Field(default=None, gt=0)
    status: ShipmentStatusEnum | None = None
    driver_id: int | None = None
    vehicle_id: int | None = None
    eta: datetime | None = None


class ShipmentRead(BaseModel):
    """Full representation returned by read endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    tracking_number: str
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    status: ShipmentStatusEnum
    weight: float
    created_at: datetime
    eta: datetime | None
    driver_id: int | None
    vehicle_id: int | None
