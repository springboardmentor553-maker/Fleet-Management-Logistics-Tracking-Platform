from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MaintenanceAlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: str = "Pending"
    next_service_date: date | None = None


class MaintenanceAlertUpdate(BaseModel):
    alert_status: str


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: str
    generated_date: datetime
    next_service_date: date | None

    model_config = ConfigDict(from_attributes=True)