from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TripBase(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: Optional[str] = "Scheduled"


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    shipment_id: Optional[int] = None
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = None


class TripResponse(BaseModel):
    id: int
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
