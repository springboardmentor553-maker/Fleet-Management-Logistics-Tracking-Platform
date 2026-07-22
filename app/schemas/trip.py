from datetime import datetime
from pydantic import BaseModel


class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime


class TripUpdate(BaseModel):
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    status: str


class TripResponse(BaseModel):
    id: int
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True