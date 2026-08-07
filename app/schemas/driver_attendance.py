from datetime import datetime
from typing import Literal
from pydantic import BaseModel


AttendanceStatus = Literal["Present", "Absent", "Leave"]


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: datetime
    attendance_status: AttendanceStatus
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: datetime
    attendance_status: str
    check_in_time: datetime | None
    check_out_time: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True