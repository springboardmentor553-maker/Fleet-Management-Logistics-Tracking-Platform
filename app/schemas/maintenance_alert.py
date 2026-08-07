from datetime import datetime
from pydantic import BaseModel


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_status: str
    created_at: datetime

    class Config:
        from_attributes = True