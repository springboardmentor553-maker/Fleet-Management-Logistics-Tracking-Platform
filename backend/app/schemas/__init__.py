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
    notification_frequency: Optional[str] = "instant"

    class Config:
        from_attributes = True


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
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: Optional[str] = None
    status: str = "active"
    experience_years: Optional[int] = None
    attendance_percentage: Optional[float] = None

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
    experience_years: Optional[int] = None
    attendance_percentage: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShipmentCreate(BaseModel):
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    origin: str
    destination: str
    weight: Optional[float] = None
    status: str = "created"
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    eta: Optional[datetime] = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_id: str
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    origin: str
    destination: str
    weight: Optional[float] = None
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

class TripCreate(BaseModel):
    shipment_id: Optional[int] = None
    vehicle_id: int
    driver_id: int
    origin: str
    destination: str
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    status: str = "scheduled"
    notes: Optional[str] = None


class TripResponse(BaseModel):
    id: int
    shipment_id: Optional[int] = None
    vehicle_id: int
    driver_id: int
    origin: str
    destination: str
    scheduled_start: datetime
    scheduled_end: Optional[datetime]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TripStatusUpdate(BaseModel):
    status: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class TripRouteResponse(BaseModel):
    pickup_location: str
    destination: str
    distance_km: float
    duration_min: float
    route_summary: str

class UpdateNotificationFrequencyRequest(BaseModel):
    frequency: str  # instant, daily, off


class DeleteAccountRequest(BaseModel):
    password: str


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class CompanySettingsResponse(BaseModel):
    company_name: str
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True

class CompanySettingsUpdate(BaseModel):
    company_name: str

class TripETAResponse(BaseModel):
    trip_id: int
    distance_km: float
    duration_min: float
    estimated_arrival: str

class ShipmentTrackingResponse(BaseModel):
    tracking_number: str
    status: str
    driver_name: Optional[str] = None
    vehicle_registration: Optional[str] = None
    pickup_location: str
    destination: str
    eta: Optional[str] = None


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    category: str
    service_date: datetime
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    status: str = "scheduled"
    notes: Optional[str] = None


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    category: str
    service_date: datetime
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceStatusUpdate(BaseModel):
    status: str


class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    assignment_date: datetime
    status: str = "assigned"
    remarks: Optional[str] = None


class DriverAssignmentResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    assignment_date: datetime
    status: str
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DriverAssignmentStatusUpdate(BaseModel):
    status: str


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: datetime
    status: str  # present, absent, leave
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: datetime
    status: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DriverPerformanceResponse(BaseModel):
    driver_id: int
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int


class MaintenanceAlertResponse(BaseModel):
    id: int
    maintenance_id: int
    vehicle_id: int
    alert_type: str
    message: str
    status: str
    next_service_date: Optional[datetime] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceAlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_type: str  # "due_soon" or "overdue"
    message: str
    next_service_date: Optional[datetime] = None


class MaintenanceAlertStatusUpdate(BaseModel):
    status: str  # "pending", "sent", or "completed"


class FuelRecordCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: Optional[float] = None
    fuel_date: datetime
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None


class FuelRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: Optional[float] = None
    fuel_date: datetime
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True