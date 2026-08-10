from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

ALLOWED_ASSIGNMENT_STATUSES = {"Active", "Assigned", "Completed", "Cancelled"}


class DriverAssignmentBase(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_status: str = "Assigned"
    remarks: Optional[str] = None

    @field_validator("assignment_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_ASSIGNMENT_STATUSES:
            raise ValueError(
                f"Invalid assignment_status '{v}'. "
                f"Allowed values: {', '.join(sorted(ALLOWED_ASSIGNMENT_STATUSES))}"
            )
        return v


class DriverAssignmentCreate(DriverAssignmentBase):
    pass


class DriverAssignmentUpdate(BaseModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    assignment_status: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("assignment_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_ASSIGNMENT_STATUSES:
            raise ValueError(
                f"Invalid assignment_status '{v}'. "
                f"Allowed values: {', '.join(sorted(ALLOWED_ASSIGNMENT_STATUSES))}"
            )
        return v


class DriverAssignmentResponse(DriverAssignmentBase):
    id: int
    assignment_date: datetime

    class Config:
        from_attributes = True
