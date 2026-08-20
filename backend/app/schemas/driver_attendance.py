from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DriverAttendanceBase(BaseModel):
    driver_id: int
    date: datetime
    attendance_status: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None


class DriverAttendanceCreate(DriverAttendanceBase):
    pass


class DriverAttendanceUpdate(BaseModel):
    date: Optional[datetime] = None
    attendance_status: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None


class DriverAttendanceResponse(DriverAttendanceBase):
    id: int

    class Config:
        from_attributes = True