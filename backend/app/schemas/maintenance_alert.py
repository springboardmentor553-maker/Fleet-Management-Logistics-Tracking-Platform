from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

ALLOWED_STATUSES = {"Pending", "Sent", "Completed"}


class MaintenanceAlertBase(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: Optional[str] = "Pending"
    next_service_date: datetime

    @field_validator("alert_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid alert status. Must be one of: {', '.join(ALLOWED_STATUSES)}")
        return v


class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass


class MaintenanceAlertUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    maintenance_id: Optional[int] = None
    alert_message: Optional[str] = None
    alert_type: Optional[str] = None
    alert_status: Optional[str] = None
    next_service_date: Optional[datetime] = None

    @field_validator("alert_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid alert status. Must be one of: {', '.join(ALLOWED_STATUSES)}")
        return v


class MaintenanceAlertResponse(MaintenanceAlertBase):
    id: int
    generated_date: datetime

    class Config:
        from_attributes = True
