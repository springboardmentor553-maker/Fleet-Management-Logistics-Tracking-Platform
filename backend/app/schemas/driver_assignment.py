from pydantic import BaseModel
from datetime import datetime

class DriverAssignmentCreate(BaseModel):
    driver_id:int
    vehicle_id:int
    trip_id:int
    assignment_status:str
    remarks:str
class DriverAssignmentResponse(DriverAssignmentCreate):
    assignment_id:int
    assignment_date:datetime
    class Config:
        from_attributes=True