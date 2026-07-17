from pydantic import BaseModel, EmailStr
from datetime import datetime

class DriverBase(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    license_number: str
    status: str = "Available"

class DriverCreate(DriverBase):
    user_id: int

class DriverResponse(DriverBase):  
    id: int
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True