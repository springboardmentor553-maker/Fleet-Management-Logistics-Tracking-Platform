from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List,Literal


class MaintenanceCreate(BaseModel):
    vehicle_id: int = Field(..., example=1)
    category: Literal[
        "Oil Change",
        "Tyre Replacement",
        "Brake Service",
        "Engine Service",
        "General Inspection",
    ] = Field(..., example="Oil Change")    
    description: Optional[str] = Field(None, example="Routine 10,000 km oil and filter change")
    cost: float = Field(default=0.0, example=150.0)
    scheduled_date: Optional[datetime] = None
    odometer_km: Optional[float] = Field(default=0.0, example=24500.0)
    health_score: Optional[int] = Field(default=95, example=95)
    notes: Optional[str] = None
    service_provider: Optional[str] = None
    next_service_date: Optional[datetime] = None


class MaintenanceUpdate(BaseModel):
    category: Optional[
    Literal[
        "Oil Change",
        "Tyre Replacement",
        "Brake Service",
        "Engine Service",
        "General Inspection",
    ]
    ]= None
    description: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[str] = None  # scheduled, in_progress, completed, cancelled
    completed_date: Optional[datetime] = None
    odometer_km: Optional[float] = None
    health_score: Optional[int] = None
    notes: Optional[str] = None
    service_provider: Optional[str] = None
    next_service_date: Optional[datetime] = None

class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    category: str
    description: Optional[str] = None
    cost: float
    status: str
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    odometer_km: float
    health_score: int
    notes: Optional[str] = None
    created_at: datetime
    service_provider: Optional[str]
    next_service_date: Optional[datetime]

    model_config = {"from_attributes": True}


class VehicleHealthReport(BaseModel):
    vehicle_id: int
    plate_number: str
    vehicle_type: str
    health_score: int
    health_status: str  # Excellent, Good, Fair, Critical Maintenance Required
    last_serviced_date: Optional[datetime] = None
    pending_maintenance_count: int
    alerts: List[str]
