from pydantic import BaseModel


class OperationalAnalyticsResponse(BaseModel):
    total_deliveries: int
    successful_deliveries: int
    delayed_deliveries: int
    cancelled_deliveries: int
    average_trip_distance: float
    average_delivery_time_minutes: float