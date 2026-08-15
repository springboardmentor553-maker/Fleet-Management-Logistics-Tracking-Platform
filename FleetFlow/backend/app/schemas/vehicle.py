from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime

class VehicleBase(BaseModel):
    registration_number: str
    vehicle_type: str
    capacity: int
    fuel_type: str
    current_status: str = "Available"

class VehicleCreate(VehicleBase):
    driver_id: int | None = None  

class VehicleResponse(VehicleBase):
    id: int
    driver_id: int | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)