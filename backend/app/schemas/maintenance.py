from pydantic import BaseModel
from datetime import datetime


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_category: str
    service_date: datetime
    next_service_date: datetime
    service_cost: float
    service_provider: str
    maintenance_status: str
    notes: str

class MaintenanceUpdate(MaintenanceCreate):
    pass


class MaintenanceResponse(MaintenanceCreate):
    maintenance_id: int
    created_at: datetime

    class Config:
        from_attributes = True