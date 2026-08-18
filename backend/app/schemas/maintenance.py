from datetime import date

from app.schemas.common import ORMModel


class MaintenanceBase(ORMModel):
    vehicle_id: int
    maintenance_category: str
    service_date: date
    next_service_date: date
    service_cost: float
    service_provider: str
    maintenance_status: str | None = None
    notes: str | None = None
    is_active: int = 1


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(ORMModel):
    vehicle_id: int | None = None
    maintenance_category: str | None = None
    service_date: date | None = None
    next_service_date: date | None = None
    service_cost: float | None = None
    service_provider: str | None = None
    maintenance_status: str | None = None
    notes: str | None = None
    is_active: int | None = None


class MaintenanceRead(MaintenanceBase):
    id: int