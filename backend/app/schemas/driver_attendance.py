from pydantic import BaseModel
from datetime import date, time

from app.enums import AttendanceStatus


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