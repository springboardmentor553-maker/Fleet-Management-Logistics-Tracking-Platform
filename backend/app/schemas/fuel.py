from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class FuelBase(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_date: date

    fuel_quantity: float = Field(
        gt=0,
        description="Fuel quantity must be greater than 0"
    )

    fuel_cost: float = Field(
        gt=0,
        description="Fuel cost must be greater than 0"
    )

    odometer_reading: int

    fuel_station: str

    remarks: Optional[str] = None


class FuelCreate(FuelBase):
    pass


class FuelUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    fuel_date: Optional[date] = None

    fuel_quantity: Optional[float] = Field(
        default=None,
        gt=0
    )

    fuel_cost: Optional[float] = Field(
        default=None,
        gt=0
    )

    odometer_reading: Optional[int] = None

    fuel_station: Optional[str] = None

    remarks: Optional[str] = None


class FuelResponse(FuelBase):
    id: int
    created_at: datetime
    is_active: int

    class Config:
        from_attributes = True