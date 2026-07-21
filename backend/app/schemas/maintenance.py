from pydantic import BaseModel
from datetime import date


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_type: str
    scheduled_date: date
    remarks: str | None = None


class MaintenanceUpdate(BaseModel):
    maintenance_type: str | None = None
    scheduled_date: date | None = None
    completed_date: date | None = None
    status: str | None = None
    remarks: str | None = None


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_type: str
    scheduled_date: date
    completed_date: date | None = None
    status: str
    remarks: str | None = None

    class Config:
        from_attributes = True