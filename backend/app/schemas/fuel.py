from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class FuelRecordBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    fuel_date: datetime
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_station: Optional[str] = None
    fuel_type: Optional[str] = None
    notes: Optional[str] = None

class FuelRecordCreate(FuelRecordBase):
    pass

class FuelRecordUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    fuel_date: Optional[datetime] = None
    fuel_quantity: Optional[float] = None
    fuel_cost: Optional[float] = None
    odometer_reading: Optional[float] = None
    fuel_station: Optional[str] = None
    fuel_type: Optional[str] = None
    notes: Optional[str] = None

class FuelRecordResponse(FuelRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    vehicle_license_plate: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class VehicleFuelSummary(BaseModel):
    vehicleId: int
    licensePlate: str
    totalFuel: float
    totalCost: float
    averageCost: float

class FuelDashboardResponse(BaseModel):
    totalFuel: float
    totalCost: float
    averageCost: float
    highestExpense: float
    lowestExpense: float
    vehicleSummary: List[VehicleFuelSummary]
