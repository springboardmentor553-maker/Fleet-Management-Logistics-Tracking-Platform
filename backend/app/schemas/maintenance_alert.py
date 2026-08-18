from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class MaintenanceAlertBase(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    next_service_date: date


class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass


class MaintenanceAlertUpdate(BaseModel):
    alert_status: Optional[str] = None


class MaintenanceAlertResponse(MaintenanceAlertBase):
    id: int
    alert_status: str
    generated_date: datetime

    class Config:
        from_attributes = True