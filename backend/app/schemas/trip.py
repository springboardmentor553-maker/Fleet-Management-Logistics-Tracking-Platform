from datetime import datetime
from pydantic import BaseModel
from app.models.trip import TripStatus


class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    trip_status: TripStatus = TripStatus.CREATED


class TripUpdate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    trip_status: TripStatus


class TripResponse(BaseModel):
    id: int
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    trip_status: TripStatus
    created_at: datetime

    class Config:
        from_attributes = True
