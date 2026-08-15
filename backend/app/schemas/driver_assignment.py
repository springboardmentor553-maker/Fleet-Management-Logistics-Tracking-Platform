from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.driver_assignment import AssignmentStatus

class DriverAssignmentBase(BaseModel):
    driver_id: int
    vehicle_id: int
    trip_id: int
    assignment_status: Optional[AssignmentStatus] = AssignmentStatus.ASSIGNED
    remarks: Optional[str] = None

class DriverAssignmentCreate(DriverAssignmentBase):
    pass

class DriverAssignmentUpdate(BaseModel):
    assignment_status: Optional[AssignmentStatus] = None
    remarks: Optional[str] = None

class DriverAssignmentResponse(DriverAssignmentBase):
    id: int
    assignment_date: datetime
    created_at: datetime
    
    # Nested info
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None

    class Config:
        from_attributes = True
