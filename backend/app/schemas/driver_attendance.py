from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: date
    attendance_status: str
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None


class DriverAttendanceUpdate(BaseModel):
    attendance_status: Optional[str] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: date
    attendance_status: str
    check_in_time: Optional[time]
    check_out_time: Optional[time]

    class Config:
        from_attributes = True