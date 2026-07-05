from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class DriverCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    license_number: str


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    is_available: Optional[bool] = None


class DriverResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    license_number: str
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}
