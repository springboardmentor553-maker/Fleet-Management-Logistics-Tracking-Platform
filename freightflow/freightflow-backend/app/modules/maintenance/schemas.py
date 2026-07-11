from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import MaintenanceType


class MaintenanceLogCreate(BaseModel):
    vehicle_id: int
    service_type: MaintenanceType
    description: str = Field(min_length=3)
    cost: float = Field(ge=0)
    performed_by: str = Field(min_length=2, max_length=120)
    performed_at: date
    next_due_at: date | None = None


class MaintenanceLogUpdate(BaseModel):
    description: str | None = None
    cost: float | None = Field(default=None, ge=0)
    next_due_at: date | None = None


class MaintenanceLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    service_type: MaintenanceType
    description: str
    cost: float
    performed_by: str
    performed_at: date
    next_due_at: date | None
    created_at: datetime
