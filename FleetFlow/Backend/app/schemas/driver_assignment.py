from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DriverAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    remarks: Optional[str] = None


class DriverAssignmentUpdate(BaseModel):
    assignment_status: Optional[str] = None
    remarks: Optional[str] = None


class DriverAssignmentResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    assignment_date: datetime
    assignment_status: str
    remarks: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
class DriverPerformanceResponse(BaseModel):
    driver_id: int
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int