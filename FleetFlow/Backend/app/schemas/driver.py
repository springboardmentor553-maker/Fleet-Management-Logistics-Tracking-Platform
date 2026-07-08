from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class DriverCreate(BaseModel):
    name: str = Field(..., example="Ravi Kumar", description="Full name of the driver")
    email: EmailStr = Field(..., example="ravi@fleetflow.com", description="Unique email address")
    phone: str = Field(..., example="+91 98765 43210", description="Contact phone number")
    license_number: str = Field(..., example="TN-01-2024-001234", description="Unique driving license number")


class DriverUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Ravi Kumar")
    email: Optional[EmailStr] = Field(None, example="ravi@fleetflow.com")
    phone: Optional[str] = Field(None, example="+91 98765 43210")
    license_number: Optional[str] = Field(None, example="TN-01-2024-001234")
    is_available: Optional[bool] = Field(None, example=True, description="True = available, False = on trip")


class DriverResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    license_number: str
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}
