from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TripBase(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    scheduled_start: datetime
    scheduled_end: datetime
    status: Optional[str] = "Scheduled"
    traffic_level: Optional[str] = "Normal"


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    shipment_id: Optional[int] = None
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = None
    traffic_level: Optional[str] = None


class TripResponse(BaseModel):
    id: int
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    pickup_latitude: Optional[float]
    pickup_longitude: Optional[float]
    destination_latitude: Optional[float]
    destination_longitude: Optional[float]
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    traffic_level: str
    created_at: datetime

    class Config:
        from_attributes = True


class TripLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class TripTrafficUpdate(BaseModel):
    traffic_level: str
