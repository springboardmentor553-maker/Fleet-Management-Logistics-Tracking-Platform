from datetime import datetime
from typing import Literal
from pydantic import BaseModel


AlertStatus = Literal["Pending", "Sent", "Completed"]


class MaintenanceAlertUpdate(BaseModel):
    alert_status: AlertStatus


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    alert_status: str
    generated_date: datetime
    next_service_date: datetime | None

    class Config:
        from_attributes = True