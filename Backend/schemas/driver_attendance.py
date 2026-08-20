from datetime import date as Date
from datetime import time

from pydantic import BaseModel

from app.models.driver_attendance_enum import AttendanceStatus


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: Date
    attendance_status: AttendanceStatus
    check_in_time: time | None = None
    check_out_time: time | None = None


class DriverAttendanceUpdate(BaseModel):
    driver_id: int | None = None
    date: Date | None = None
    attendance_status: AttendanceStatus | None = None
    check_in_time: time | None = None
    check_out_time: time | None = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: Date
    attendance_status: AttendanceStatus
    check_in_time: time | None
    check_out_time: time | None

    class Config:
        from_attributes = True