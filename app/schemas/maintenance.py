from pydantic import BaseModel
from datetime import date

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_date: date
    maintenance_type: str
    cost: float
    status: str


class MaintenanceResponse(MaintenanceCreate):
    id: int

    class Config:
        from_attributes = True
class MaintenanceUpdate(BaseModel):
    vehicle_id: int
    service_date: date
    maintenance_type: str
    cost: float
    status: str