from pydantic import BaseModel, field_validator
from datetime import date, time
from typing import Optional

VALID_ATTENDANCE_STATUSES = {"Present", "Absent", "Leave"}


class DriverAttendanceBase(BaseModel):
    driver_id: int
    date: date
    attendance_status: str
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None

    @field_validator("attendance_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_ATTENDANCE_STATUSES:
            raise ValueError(
                f"Invalid attendance_status '{v}'. "
                f"Allowed values: {', '.join(sorted(VALID_ATTENDANCE_STATUSES))}"
            )
        return v


class DriverAttendanceCreate(DriverAttendanceBase):
    pass


class DriverAttendanceUpdate(BaseModel):
    driver_id: Optional[int] = None
    date: Optional[date] = None
    attendance_status: Optional[str] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None

    @field_validator("attendance_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_ATTENDANCE_STATUSES:
            raise ValueError(
                f"Invalid attendance_status '{v}'. "
                f"Allowed values: {', '.join(sorted(VALID_ATTENDANCE_STATUSES))}"
            )
        return v


class DriverAttendanceResponse(DriverAttendanceBase):
    id: int

    class Config:
        from_attributes = True
