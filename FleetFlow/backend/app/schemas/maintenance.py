from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.enums.maintenance_category import MaintenanceCategory


class MaintenanceBase(BaseModel):
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: date
    next_service_date: date | None = None
    service_cost: float
    service_provider: str
    maintenance_status: str
    notes: str | None = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    vehicle_id: int | None = None
    maintenance_category: MaintenanceCategory | None = None
    service_date: date | None = None
    next_service_date: date | None = None
    service_cost: float | None = None
    service_provider: str | None = None
    maintenance_status: str | None = None
    notes: str | None = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)