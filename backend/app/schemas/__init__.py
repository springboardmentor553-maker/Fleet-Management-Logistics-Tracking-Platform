# Schemas package containing all Pydantic request and response schemas
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    fleet_manager = "fleet_manager"
    driver = "driver"
    dispatcher = "dispatcher"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.driver


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True  # allows conversion from SQLAlchemy model


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type: str
    capacity: Optional[float] = None
    fuel_type: Optional[str] = None
    status: str = "available"


class VehicleResponse(BaseModel):
    id: int
    registration_number: str
    vehicle_type: str
    capacity: Optional[float]
    fuel_type: Optional[str]
    status: str

    class Config:
        from_attributes = True

class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: Optional[str] = None
    status: str = "active"


class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: Optional[str]
    status: str

    class Config:
        from_attributes = True