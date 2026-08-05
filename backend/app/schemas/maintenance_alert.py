from pydantic import BaseModel
from datetime import datetime
from app.enums import AlertStatus


class MaintenanceAlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: AlertStatus = AlertStatus.PENDING
    next_service_date: datetime


class MaintenanceAlertUpdate(BaseModel):
    alert_status: AlertStatus


class MaintenanceAlertResponse(MaintenanceAlertCreate):
    alert_id: int
    generated_date: datetime

    class Config:
        from_attributes = True