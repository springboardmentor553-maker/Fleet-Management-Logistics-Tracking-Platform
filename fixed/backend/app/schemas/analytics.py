from typing import Optional
from pydantic import BaseModel


class VehicleFuelUsage(BaseModel):
    vehicle_id: int
    vehicle_number: str
    total_liters: float


class FuelAnalyticsResponse(BaseModel):
    total_fuel_consumed: float
    total_fuel_cost: float
    average_fuel_consumption: float
    vehicle_with_highest_fuel_usage: Optional[VehicleFuelUsage] = None
    vehicle_with_lowest_fuel_usage: Optional[VehicleFuelUsage] = None


class FleetDashboardResponse(BaseModel):
    total_vehicles: int
    active_vehicles: int
    vehicles_under_maintenance: int
    total_drivers: int
    available_drivers: int
    assigned_drivers: int
    total_trips: int
    completed_trips: int
    active_shipments: int


class OperationsAnalyticsResponse(BaseModel):
    total_deliveries: int
    successful_deliveries: int
    delayed_deliveries: int
    cancelled_deliveries: int
    average_trip_distance: float
    average_delivery_time: float
