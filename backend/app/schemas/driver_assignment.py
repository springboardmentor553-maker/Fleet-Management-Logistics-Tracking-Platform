from pydantic import BaseModel
from datetime import date


class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_date: date
    remarks: str | None = None


class DriverAssignmentUpdate(BaseModel):
    vehicle_id: int | None = None
    trip_id: int | None = None
    assignment_date: date | None = None
    remarks: str | None = None
    status: str | None = None


class DriverAssignmentRelease(BaseModel):
    release_date: date


class DriverAssignmentResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_date: date
    release_date: date | None = None
    status: str
    remarks: str | None = None

    class Config:
        from_attributes = True