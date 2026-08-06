from pydantic import BaseModel
from typing import Optional


class VehicleUsageInfo(BaseModel):
    vehicle_id: int
    plate_number: str
    total_fuel: float


class FuelAnalyticsResponse(BaseModel):
    total_fuel_consumed: float
    total_fuel_cost: float
    average_fuel_consumption: float
    vehicle_highest_usage: Optional[VehicleUsageInfo] = None
    vehicle_lowest_usage: Optional[VehicleUsageInfo] = None


class OperationalAnalyticsResponse(BaseModel):
    total_deliveries: int
    successful_deliveries: int
    delayed_deliveries: int
    cancelled_deliveries: int
    average_trip_distance: float  # in km
    average_delivery_time: float  # in hours
