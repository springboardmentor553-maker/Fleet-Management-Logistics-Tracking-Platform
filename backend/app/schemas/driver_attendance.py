from pydantic import BaseModel
from datetime import date, time
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: date
    attendance_status: AttendanceStatus
    check_in_time: time | None = None
    check_out_time: time | None = None


class DriverAttendanceResponse(DriverAttendanceCreate):
    attendance_id: int

    class Config:
        from_attributes = True