from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

ALLOWED_CATEGORIES = {"Oil Change", "Tyre Replacement", "Brake Service", "Engine Service", "General Inspection"}
ALLOWED_STATUSES = {"Scheduled", "In Progress", "Completed", "Cancelled"}


class MaintenanceBase(BaseModel):
    vehicle_id: int
    maintenance_category: str
    service_date: datetime
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    maintenance_status: str
    notes: Optional[str] = None

    @field_validator("maintenance_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            raise ValueError(f"Invalid maintenance category. Must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return v

    @field_validator("maintenance_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid maintenance status. Must be one of: {', '.join(ALLOWED_STATUSES)}")
        return v


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    maintenance_category: Optional[str] = None
    service_date: Optional[datetime] = None
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    maintenance_status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("maintenance_category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_CATEGORIES:
            raise ValueError(f"Invalid maintenance category. Must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return v

    @field_validator("maintenance_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid maintenance status. Must be one of: {', '.join(ALLOWED_STATUSES)}")
        return v


class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
