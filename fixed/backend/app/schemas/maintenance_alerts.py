from datetime import date, datetime
from typing import Optional
from pydantic import Field

from app.schemas.common import ORMModel


class MaintenanceAlertBase(ORMModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str = "Upcoming Service"
    alert_status: str = Field(default="Pending", description="Status options: Pending, Sent, Completed")
    next_service_date: Optional[date] = None


class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass


class MaintenanceAlertUpdateStatus(ORMModel):
    alert_status: str = Field(..., description="Status options: Pending, Sent, Completed")


class MaintenanceAlertUpdate(ORMModel):
    alert_message: Optional[str] = None
    alert_type: Optional[str] = None
    alert_status: Optional[str] = None
    next_service_date: Optional[date] = None


class MaintenanceAlertRead(MaintenanceAlertBase):
    id: int
    generated_date: Optional[datetime] = None
