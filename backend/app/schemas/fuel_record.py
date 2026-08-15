from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class FuelRecordBase(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_quantity: float = Field(..., gt=0)
    fuel_cost: float = Field(..., gt=0)
    odometer_reading: float
    fuel_date: datetime
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

class FuelRecordCreate(FuelRecordBase):
    pass

class FuelRecordUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    fuel_quantity: Optional[float] = Field(None, gt=0)
    fuel_cost: Optional[float] = Field(None, gt=0)
    odometer_reading: Optional[float] = None
    fuel_date: Optional[datetime] = None
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

class FuelRecordResponse(FuelRecordBase):
    id: int
    created_at: datetime
    
    # Extra fields for ease of use in UI
    vehicle_license_plate: Optional[str] = None
    driver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
