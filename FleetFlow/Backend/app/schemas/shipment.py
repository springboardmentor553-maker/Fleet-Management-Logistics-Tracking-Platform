from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

SHIPMENT_STATUSES = {"pending", "in_transit", "delivered", "cancelled"}


class ShipmentCreate(BaseModel):
    origin: str = Field(..., example="Chennai", description="Pickup location")
    destination: str = Field(..., example="Mumbai", description="Drop-off location")
    weight_kg: float = Field(..., example=500.0, gt=0, description="Cargo weight in kilograms")


class ShipmentUpdate(BaseModel):
    origin: Optional[str] = Field(None, example="Chennai")
    destination: Optional[str] = Field(None, example="Mumbai")
    weight_kg: Optional[float] = Field(None, example=500.0, gt=0)
    status: Optional[str] = Field(None, example="pending", description="pending | in_transit | delivered | cancelled")
    driver_id: Optional[int] = Field(None, example=1)
    vehicle_id: Optional[int] = Field(None, example=1)

    @field_validator("weight_kg")
    @classmethod
    def weight_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("weight_kg must be greater than 0")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SHIPMENT_STATUSES:
            raise ValueError(f"status must be one of {sorted(SHIPMENT_STATUSES)}")
        return v


class ShipmentAssign(BaseModel):
    driver_id: int = Field(..., example=1, description="ID of an available driver")
    vehicle_id: int = Field(..., example=1, description="ID of an available vehicle")


class ShipmentResponse(BaseModel):
    id: int
    origin: str
    destination: str
    weight_kg: float
    status: str
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    created_at: datetime
    delivered_at: Optional[datetime]

    model_config = {"from_attributes": True}
