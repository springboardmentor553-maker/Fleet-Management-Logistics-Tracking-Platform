from datetime import date

from pydantic import BaseModel


class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_date: date
    assignment_status: str = "Assigned"
    remarks: str | None = None


class DriverAssignmentUpdate(BaseModel):
    assignment_status: str | None = None
    remarks: str | None = None


class DriverAssignmentResponse(DriverAssignmentCreate):
    id: int

    class Config:
        from_attributes = True