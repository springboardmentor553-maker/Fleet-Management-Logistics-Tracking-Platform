from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.maintenance_alert import AlertStatus

class MaintenanceAlertBase(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: Optional[AlertStatus] = AlertStatus.PENDING
    next_service_date: datetime

class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass

class MaintenanceAlertUpdate(BaseModel):
    alert_message: Optional[str] = None
    alert_type: Optional[str] = None
    alert_status: Optional[AlertStatus] = None
    next_service_date: Optional[datetime] = None

class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: AlertStatus
    next_service_date: datetime
    generated_date: datetime
    created_at: datetime
    
    # UI specific fields
    vehicle: str = ""
    license_plate: str = ""
    category: str = ""
    alert: str = ""

    model_config = ConfigDict(from_attributes=True)
