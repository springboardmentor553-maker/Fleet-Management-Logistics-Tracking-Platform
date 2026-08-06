from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class FuelRecordBase(BaseModel):
    vehicle_id: int
    driver_id: int

    fuel_quantity: float = Field(gt=0)
    fuel_cost: float = Field(gt=0)

    odometer_reading: float

    fuel_date: date

    fuel_station: str

    remarks: Optional[str] = None


class FuelRecordCreate(FuelRecordBase):
    pass


class FuelRecordUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    fuel_quantity: Optional[float] = Field(
        default=None,
        gt=0
    )

    fuel_cost: Optional[float] = Field(
        default=None,
        gt=0
    )

    odometer_reading: Optional[float] = None

    fuel_date: Optional[date] = None

    fuel_station: Optional[str] = None

    remarks: Optional[str] = None


class FuelRecordResponse(FuelRecordBase):
    id: int

    class Config:
        from_attributes = True