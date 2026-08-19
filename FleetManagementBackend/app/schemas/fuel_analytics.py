from pydantic import BaseModel


class FuelAnalyticsResponse(BaseModel):
    total_fuel_consumed: float
    total_fuel_cost: float
    average_fuel_consumption: float
    highest_fuel_usage_vehicle: str
    lowest_fuel_usage_vehicle: str
    fuel_records: list