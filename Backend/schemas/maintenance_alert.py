from datetime import date, datetime

from pydantic import BaseModel

from app.models.maintenance_alert_enum import AlertStatus
from app.models.maintenance_alert_type_enum import AlertType


class MaintenanceAlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: AlertType
    next_service_date: date


class MaintenanceAlertUpdate(BaseModel):
    alert_status: AlertStatus


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: AlertType
    alert_status: AlertStatus
    generated_date: date
    next_service_date: date
    created_at: datetime

    class Config:
        from_attributes = True