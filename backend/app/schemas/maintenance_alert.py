from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.enums import AlertStatus


class MaintenanceAlertBase(BaseModel):
    vehicle_id: int
    maintenance_id: int

    alert_message: str
    alert_type: str

    alert_status: AlertStatus = AlertStatus.PENDING

    next_service_date: datetime


class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass


class MaintenanceAlertUpdate(BaseModel):
    alert_status: AlertStatus


class MaintenanceAlertResponse(MaintenanceAlertBase):
    id: int
    generated_date: datetime

    class Config:
        from_attributes = True