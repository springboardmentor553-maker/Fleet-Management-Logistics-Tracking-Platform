from datetime import datetime
from pydantic import BaseModel


class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int


class DriverAssignmentResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int
    trip_id: int
    assigned_at: datetime
    status: str

    class Config:
        from_attributes = True