from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole
from app.models.driver import DriverStatus

class DriverResponse(BaseModel):
    id: int
    license_number: str
    phone_number: str
    status: DriverStatus

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    driver: Optional[DriverResponse] = None

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2, description="Full name must be at least 2 characters")
    role: UserRole = Field(default=UserRole.DRIVER)
    
    # Optional driver details (required only if role is DRIVER)
    license_number: Optional[str] = None
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: EmailStr
    full_name: Optional[str] = None
