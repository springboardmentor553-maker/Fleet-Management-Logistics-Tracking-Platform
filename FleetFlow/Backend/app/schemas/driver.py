from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, date


def validate_and_normalize_license(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v_clean = v.strip().upper()
    if not v_clean:
        raise ValueError("License number cannot be empty")
    if len(v_clean) < 5 or len(v_clean) > 20:
        raise ValueError("License number must be between 5 and 20 characters long")
    return v_clean


class DriverCreate(BaseModel):
    name: str = Field(..., example="Ravi Kumar", description="Full name of the driver")
    email: EmailStr = Field(..., example="ravi@fleetflow.com", description="Unique email address")
    phone: str = Field(..., example="+91 98765 43210", description="Contact phone number")
    license_number: str = Field(..., example="TN-01-2024-001234", description="Unique driving license number")
    assigned_vehicle_id: Optional[int] = None

    @field_validator("license_number")
    @classmethod
    def validate_license(cls, v: str) -> str:
        res = validate_and_normalize_license(v)
        return res or ""


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

    @field_validator("license_number")
    @classmethod
    def validate_license(cls, v: Optional[str]) -> Optional[str]:
        return validate_and_normalize_license(v)



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
    date: str                  # YYYY-MM-DD
    status: str = "present"
    check_in: Optional[str] = None
    check_out: Optional[str] = None


class DriverAttendanceResponse(BaseModel):
    id: int
    driver_id: int
    date: str
    status: str
    check_in: Optional[str]
    check_out: Optional[str]
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
