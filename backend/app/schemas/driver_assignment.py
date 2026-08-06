from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DriverAssignmentBase(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int

    assignment_status: str
    remarks: Optional[str] = None


class DriverAssignmentCreate(DriverAssignmentBase):
    pass


class DriverAssignmentUpdate(BaseModel):
    assignment_status: Optional[str] = None
    remarks: Optional[str] = None


class DriverAssignmentResponse(DriverAssignmentBase):
    id: int
    assignment_date: datetime

    class Config:
        from_attributes = True