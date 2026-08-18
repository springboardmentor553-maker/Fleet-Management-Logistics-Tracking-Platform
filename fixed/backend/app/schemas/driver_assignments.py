import datetime
from typing import Optional
from app.schemas.common import ORMModel


class DriverAssignmentBase(ORMModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_status: str = "Assigned"
    remarks: Optional[str] = None


class DriverAssignmentCreate(DriverAssignmentBase):
    pass


class DriverAssignmentUpdate(ORMModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    assignment_status: Optional[str] = None
    remarks: Optional[str] = None


class DriverAssignmentRead(DriverAssignmentBase):
    id: int
    assignment_date: Optional[datetime.datetime] = None
