from datetime import date, time

from pydantic import BaseModel, ConfigDict


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: date
    attendance_status: str
    check_in_time: time | None = None
    check_out_time: time | None = None


class DriverAttendanceUpdate(BaseModel):
    attendance_status: str | None = None
    check_in_time: time | None = None
    check_out_time: time | None = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: date
    attendance_status: str
    check_in_time: time | None
    check_out_time: time | None

    model_config = ConfigDict(from_attributes=True)