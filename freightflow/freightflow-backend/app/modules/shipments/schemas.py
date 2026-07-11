from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import ShipmentStatus


class ShipmentCreate(BaseModel):
    reference_code: str = Field(min_length=3, max_length=30)
    origin: str = Field(min_length=2, max_length=180)
    destination: str = Field(min_length=2, max_length=180)
    weight_kg: float = Field(gt=0)
    scheduled_at: datetime


class ShipmentUpdate(BaseModel):
    origin: str | None = None
    destination: str | None = None
    weight_kg: float | None = Field(default=None, gt=0)
    status: ShipmentStatus | None = None
    scheduled_at: datetime | None = None


class ShipmentAssign(BaseModel):
    vehicle_id: int
    driver_id: int


class ShipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_code: str
    origin: str
    destination: str
    weight_kg: float
    status: ShipmentStatus
    vehicle_id: int | None
    driver_id: int | None
    scheduled_at: datetime
    delivered_at: datetime | None
    created_at: datetime
