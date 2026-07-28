from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.models.trip import TripStatus


class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    route_id: int
    start_date: Optional[datetime] = None
    expected_end_date: Optional[datetime] = None
    notes: Optional[str] = None


class TripUpdate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    route_id: int
    start_date: Optional[datetime] = None
    expected_end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    status: TripStatus
    notes: Optional[str] = None


class TripStatusUpdate(BaseModel):
    status: TripStatus


class TripResponse(BaseModel):
    id: int
    trip_number: str
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    route_id: int

    start_date: Optional[datetime]
    expected_end_date: Optional[datetime]
    actual_end_date: Optional[datetime]

    status: TripStatus
    notes: Optional[str]

    created_at: datetime

    class Config:
        from_attributes = True