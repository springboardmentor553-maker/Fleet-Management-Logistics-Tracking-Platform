from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class FuelRecordCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_quantity: float = Field(gt=0)
    fuel_cost: float = Field(gt=0)
    odometer_reading: float = Field(ge=0)
    fuel_date: date
    fuel_station: str
    remarks: str | None = None


class FuelRecordUpdate(BaseModel):
    vehicle_id: int | None = None
    driver_id: int | None = None
    fuel_quantity: float | None = Field(default=None, gt=0)
    fuel_cost: float | None = Field(default=None, gt=0)
    odometer_reading: float | None = Field(default=None, ge=0)
    fuel_date: date | None = None
    fuel_station: str | None = None
    remarks: str | None = None


class FuelRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_date: date
    fuel_station: str
    remarks: str | None

    model_config = ConfigDict(from_attributes=True)