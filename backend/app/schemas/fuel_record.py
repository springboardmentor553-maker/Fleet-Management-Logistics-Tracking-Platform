from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional


class FuelRecordBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_date: date
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("fuel_quantity")
    @classmethod
    def validate_fuel_quantity(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("fuel_quantity must be greater than 0")
        return v

    @field_validator("fuel_cost")
    @classmethod
    def validate_fuel_cost(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("fuel_cost must be greater than 0")
        return v

    @field_validator("odometer_reading")
    @classmethod
    def validate_odometer_reading(cls, v: float) -> float:
        if v < 0:
            raise ValueError("odometer_reading cannot be negative")
        return v


class FuelRecordCreate(FuelRecordBase):
    pass


class FuelRecordUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    fuel_quantity: Optional[float] = None
    fuel_cost: Optional[float] = None
    odometer_reading: Optional[float] = None
    fuel_date: Optional[date] = None
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("fuel_quantity")
    @classmethod
    def validate_fuel_quantity(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("fuel_quantity must be greater than 0")
        return v

    @field_validator("fuel_cost")
    @classmethod
    def validate_fuel_cost(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("fuel_cost must be greater than 0")
        return v

    @field_validator("odometer_reading")
    @classmethod
    def validate_odometer_reading(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("odometer_reading cannot be negative")
        return v


class FuelRecordResponse(FuelRecordBase):
    id: int

    class Config:
        from_attributes = True
