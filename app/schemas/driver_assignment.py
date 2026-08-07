from datetime import datetime
from pydantic import BaseModel


class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_date: datetime
    assignment_status: str = "Active"
    remarks: str | None = None


class DriverAssignmentUpdate(BaseModel):
    assignment_status: str
    remarks: str | None = None


class DriverAssignmentResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_date: datetime
    assignment_status: str
    remarks: str | None
    created_at: datetime

    class Config:
        from_attributes = True