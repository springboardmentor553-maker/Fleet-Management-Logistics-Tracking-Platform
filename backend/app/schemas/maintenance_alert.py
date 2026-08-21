from datetime import date
from pydantic import BaseModel


class MaintenanceAlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    generated_date: date
    next_service_date: date


class MaintenanceAlertUpdate(BaseModel):
    alert_status: str


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: str
    generated_date: date
    next_service_date: date

    class Config:
        from_attributes = True