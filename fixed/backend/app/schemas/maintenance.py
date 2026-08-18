from datetime import date, datetime
from typing import Optional

from app.models import MaintenanceCategory
from app.schemas.common import ORMModel


class MaintenanceBase(ORMModel):
    vehicle_id: int
    category: MaintenanceCategory = MaintenanceCategory.GENERAL_INSPECTION
    service_date: date
    next_service_date: Optional[date] = None
    cost: Optional[float] = None
    service_provider: Optional[str] = None
    status: str = "scheduled"
    notes: Optional[str] = None
    description: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(ORMModel):
    vehicle_id: Optional[int] = None
    category: Optional[MaintenanceCategory] = None
    service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    cost: Optional[float] = None
    service_provider: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    description: Optional[str] = None


class MaintenanceRead(MaintenanceBase):
    id: int
    created_at: Optional[datetime] = None
    is_deleted: int = 0

