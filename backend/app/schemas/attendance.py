from pydantic import BaseModel
from typing import Optional
import datetime
from app.models.driver_attendance import AttendanceStatus

class DriverAttendanceBase(BaseModel):
    driver_id: int
    date: Optional[datetime.date] = None
    attendance_status: Optional[AttendanceStatus] = AttendanceStatus.PRESENT
    check_in_time: Optional[datetime.datetime] = None
    check_out_time: Optional[datetime.datetime] = None

class DriverAttendanceCreate(DriverAttendanceBase):
    pass

class DriverAttendanceUpdate(BaseModel):
    attendance_status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime.datetime] = None
    check_out_time: Optional[datetime.datetime] = None

class DriverAttendanceResponse(DriverAttendanceBase):
    id: int
    created_at: datetime.datetime
    driver_name: Optional[str] = None

    class Config:
        from_attributes = True
