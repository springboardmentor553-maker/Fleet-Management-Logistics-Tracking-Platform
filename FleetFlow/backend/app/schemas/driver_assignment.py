from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DriverAssignmentBase(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_status: str
    remarks: str | None = None


class DriverAssignmentCreate(DriverAssignmentBase):
    pass


class DriverAssignmentUpdate(BaseModel):
    driver_id: int | None = None
    vehicle_id: int | None = None
    trip_id: int | None = None
    assignment_status: str | None = None
    remarks: str | None = None


class DriverAssignmentResponse(DriverAssignmentBase):
    id: int
    assignment_date: datetime

    model_config = ConfigDict(from_attributes=True)