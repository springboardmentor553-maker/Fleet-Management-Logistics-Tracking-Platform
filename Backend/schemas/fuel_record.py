from datetime import date, datetime

from pydantic import BaseModel


class FuelRecordCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_date: date
    fuel_station: str
    remarks: str | None = None


class FuelRecordUpdate(BaseModel):
    vehicle_id: int | None = None
    driver_id: int | None = None
    fuel_quantity: float | None = None
    fuel_cost: float | None = None
    odometer_reading: float | None = None
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
    remarks: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True