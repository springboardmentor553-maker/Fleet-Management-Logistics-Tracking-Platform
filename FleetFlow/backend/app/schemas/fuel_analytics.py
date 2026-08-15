from pydantic import BaseModel


class FuelAnalyticsResponse(BaseModel):
    total_fuel_consumed: float
    total_fuel_cost: float
    average_fuel_consumption: float
    vehicle_with_highest_fuel_usage: int | None
    vehicle_with_lowest_fuel_usage: int | None