import datetime
from typing import Optional
from app.models import AttendanceStatus
from app.schemas.common import ORMModel


class DriverAttendanceBase(ORMModel):
    driver_id: int
    date: datetime.date
    attendance_status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in_time: Optional[datetime.datetime] = None
    check_out_time: Optional[datetime.datetime] = None


class DriverAttendanceCreate(DriverAttendanceBase):
    pass


class DriverAttendanceUpdate(ORMModel):
    driver_id: Optional[int] = None
    date: Optional[datetime.date] = None
    attendance_status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime.datetime] = None
    check_out_time: Optional[datetime.datetime] = None


class DriverAttendanceRead(DriverAttendanceBase):
    id: int
