from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class DriverCreate(BaseModel):
    name: str = Field(..., example="Ravi Kumar", description="Full name of the driver")
    email: EmailStr = Field(..., example="ravi@fleetflow.com", description="Unique email address")
    phone: str = Field(..., example="+91 98765 43210", description="Contact phone number")
    license_number: str = Field(..., example="TN-01-2024-001234", description="Unique driving license number")
    assigned_vehicle_id: Optional[int] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Ravi Kumar")
    email: Optional[EmailStr] = Field(None, example="ravi@fleetflow.com")
    phone: Optional[str] = Field(None, example="+91 98765 43210")
    license_number: Optional[str] = Field(None, example="TN-01-2024-001234")
    is_available: Optional[bool] = Field(None, example=True, description="True = available, False = on trip")
    assigned_vehicle_id: Optional[int] = None
    attendance_status: Optional[str] = None  # present, absent, on_leave
    safety_score: Optional[int] = None
    rating: Optional[float] = None


class DriverResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    license_number: str
    is_available: bool
    assigned_vehicle_id: Optional[int] = None
    attendance_status: str = "present"
    safety_score: int = 95
    completed_trips_count: int = 0
    total_distance_km: float = 0.0
    rating: float = 4.8
    created_at: datetime

    model_config = {"from_attributes": True}


class DriverAttendanceCreate(BaseModel):
    driver_id: int
    date: str
    status: str  # present, absent, on_leave
    check_in: Optional[str] = "09:00 AM"
    check_out: Optional[str] = "06:00 PM"


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: str
    status: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DriverActivityLogResponse(BaseModel):
    id: int
    driver_id: int
    action: str
    details: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class DriverAnalyticsResponse(BaseModel):
    total_drivers: int
    active_drivers: int
    present_today: int
    on_leave: int
    absent: int
    avg_safety_score: float
    total_completed_trips: int
    top_performing_driver: Optional[str] = None
