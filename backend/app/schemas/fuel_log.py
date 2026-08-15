from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    driver_id: Optional[int] = None
    fuel_date: datetime
    fuel_quantity: float
    fuel_cost: float
    fuel_price_per_liter: float
    odometer_reading: float
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    driver_id: Optional[int] = None
    fuel_date: Optional[datetime] = None
    fuel_quantity: Optional[float] = None
    fuel_cost: Optional[float] = None
    fuel_price_per_liter: Optional[float] = None
    odometer_reading: Optional[float] = None
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

class FuelLogResponse(FuelLogBase):
    id: int
    created_at: datetime
    updated_at: datetime
    vehicle_license_plate: Optional[str] = None
    driver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FuelAnalyticsResponse(BaseModel):
    total_fuel_consumed: float
    total_fuel_cost: float
    average_trip_consumption: float
    average_cost_per_trip: float
    most_efficient_vehicle: str
    highest_consuming_driver: str
    highest_expense: float = 0.0

class VehicleFuelChart(BaseModel):
    vehicle_id: int
    license_plate: str
    fuel_consumed: float
    total_cost: float = 0.0

class DriverFuelChart(BaseModel):
    driver_id: int
    driver_name: str
    fuel_consumed: float

class MonthlyFuelChart(BaseModel):
    month: str
    fuel_usage: float
    fuel_cost: float
