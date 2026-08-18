from pydantic import BaseModel


class DriverPerformanceResponse(BaseModel):
    driver_id: int
    driver_name: str
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int