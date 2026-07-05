from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    plate_number: str
    model: str
    capacity_kg: float

    @field_validator("capacity_kg")
    @classmethod
    def capacity_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("capacity_kg must be greater than 0")
        return v


class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = None
    model: Optional[str] = None
    capacity_kg: Optional[float] = None
    is_available: Optional[bool] = None

    @field_validator("capacity_kg")
    @classmethod
    def capacity_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("capacity_kg must be greater than 0")
        return v


class VehicleResponse(BaseModel):
    id: int
    plate_number: str
    model: str
    capacity_kg: float
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}
