from datetime import date
from pydantic import BaseModel
from app.enums.maintenance_category import MaintenanceCategory


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: date
    next_service_date: date
    service_cost: float
    service_provider: str
    notes: str | None = None


class MaintenanceUpdate(BaseModel):
    maintenance_category: MaintenanceCategory | None = None
    service_date: date | None = None
    next_service_date: date | None = None
    service_cost: float | None = None
    service_provider: str | None = None
    status: str | None = None
    notes: str | None = None


class MaintenanceStatusUpdate(BaseModel):
    status: str


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: date
    next_service_date: date
    service_cost: float
    service_provider: str
    status: str
    notes: str | None = None
    is_active: int

    class Config:
        from_attributes = True