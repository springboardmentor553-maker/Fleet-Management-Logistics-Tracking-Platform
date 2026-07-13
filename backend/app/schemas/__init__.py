# Schemas package containing all Pydantic request and response schemas
from pydantic import BaseModel, EmailStr, field_validator
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
    photo_url: Optional[str] = None

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
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None


class VehicleResponse(BaseModel):
    id: int
    registration_number: str
    vehicle_type: str
    capacity: Optional[float]
    fuel_type: Optional[str]
    status: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

    class Config:
        from_attributes = True

class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: Optional[str] = None
    status: str = "active"

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v == '':
            return v
        if not v.isdigit() or len(v) != 10:
            raise ValueError('Phone number must be exactly 10 digits')
        return v

class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: Optional[str]
    status: str

    class Config:
        from_attributes = True


class ShipmentCreate(BaseModel):
    tracking_id: str
    origin: str
    destination: str
    status: str = "created"
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    eta: Optional[datetime] = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_id: str
    origin: str
    destination: str
    status: str
    vehicle_id: Optional[int]
    driver_id: Optional[int]
    eta: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ShipmentStatusUpdate(BaseModel):
    status: str

class UpdateProfileRequest(BaseModel):
    name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str