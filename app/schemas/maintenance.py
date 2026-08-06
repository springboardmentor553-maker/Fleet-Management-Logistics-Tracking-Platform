from datetime import datetime
from typing import Literal
from pydantic import BaseModel


MaintenanceCategory = Literal[
    "Oil Change",
    "Tyre Replacement",
    "Brake Service",
    "Engine Service",
    "General Inspection",
]


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: datetime
    next_service_date: datetime | None = None
    service_cost: float
    service_provider: str
    maintenance_status: str = "Scheduled"
    notes: str | None = None


class MaintenanceUpdate(BaseModel):
    maintenance_category: MaintenanceCategory
    service_date: datetime
    next_service_date: datetime | None = None
    service_cost: float
    service_provider: str
    maintenance_status: str
    notes: str | None = None


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_category: str
    service_date: datetime
    next_service_date: datetime | None
    service_cost: float
    service_provider: str
    maintenance_status: str
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True