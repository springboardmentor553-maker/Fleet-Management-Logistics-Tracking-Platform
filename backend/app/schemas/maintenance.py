from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.enums import (
    MaintenanceCategory,
    MaintenanceStatus
)


class MaintenanceBase(BaseModel):
    vehicle_id: int

    maintenance_category: MaintenanceCategory

    service_date: datetime
    next_service_date: datetime

    service_cost: float

    service_provider: str

    maintenance_status: MaintenanceStatus = (
        MaintenanceStatus.PENDING
    )

    notes: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(MaintenanceBase):
    pass


class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True