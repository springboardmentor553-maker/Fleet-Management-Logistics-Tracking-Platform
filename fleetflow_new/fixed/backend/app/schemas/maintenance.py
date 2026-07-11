from datetime import date

from app.schemas.common import ORMModel


class MaintenanceBase(ORMModel):
    vehicle_id: int
    service_date: date
    description: str
    cost: float | None = None
    status: str = "scheduled"


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(ORMModel):
    vehicle_id: int | None = None
    service_date: date | None = None
    description: str | None = None
    cost: float | None = None
    status: str | None = None


class MaintenanceRead(MaintenanceBase):
    id: int
