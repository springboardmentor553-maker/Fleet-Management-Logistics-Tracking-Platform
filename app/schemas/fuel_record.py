from datetime import datetime
from pydantic import BaseModel


class FuelRecordCreate(BaseModel):
    vehicle_id: int
    fuel_date: datetime
    liters: float
    cost: float
    odometer_reading: float | None = None
    fuel_station: str | None = None


class FuelRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    fuel_date: datetime
    liters: float
    cost: float
    odometer_reading: float | None
    fuel_station: str | None
    created_at: datetime

    class Config:
        from_attributes = True