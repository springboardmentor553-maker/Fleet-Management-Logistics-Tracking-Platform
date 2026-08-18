from app.schemas.common import ORMModel


class DriverPerformanceRead(ORMModel):
    driver_id: int
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int
