from pydantic import BaseModel


class DriverPerformanceResponse(BaseModel):
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int