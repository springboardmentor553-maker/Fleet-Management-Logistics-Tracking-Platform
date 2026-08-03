from pydantic import BaseModel
from datetime import datetime

class FuelRecordCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_date: datetime
    fuel_station: str
    remarks: str | None = None


class FuelRecordResponse(FuelRecordCreate):
    fuel_record_id: int

    class Config:
        from_attributes = True