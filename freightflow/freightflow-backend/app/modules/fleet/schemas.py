from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import VehicleStatus


class VehicleCreate(BaseModel):
    plate_number: str = Field(min_length=2, max_length=20)
    vehicle_type: str = Field(min_length=2, max_length=50)
    capacity_kg: float = Field(gt=0)
    purchased_on: date | None = None


class VehicleUpdate(BaseModel):
    vehicle_type: str | None = None
    capacity_kg: float | None = Field(default=None, gt=0)
    status: VehicleStatus | None = None
    odometer_km: int | None = Field(default=None, ge=0)


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plate_number: str
    vehicle_type: str
    capacity_kg: float
    status: VehicleStatus
    odometer_km: int
    purchased_on: date | None
    created_at: datetime
