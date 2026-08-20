from datetime import date, datetime

from pydantic import BaseModel

from app.models.maintenance_enum import MaintenanceCategory


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: date
    next_service_date: date | None = None
    service_cost: float
    service_provider: str
    maintenance_status: str = "Scheduled"
    notes: str | None = None


class MaintenanceUpdate(BaseModel):
    vehicle_id: int | None = None
    maintenance_category: MaintenanceCategory | None = None
    service_date: date | None = None
    next_service_date: date | None = None
    service_cost: float | None = None
    service_provider: str | None = None
    maintenance_status: str | None = None
    notes: str | None = None


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: date
    next_service_date: date | None
    service_cost: float
    service_provider: str
    maintenance_status: str
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True