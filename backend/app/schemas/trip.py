from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TripBase(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int

    start_location: str
    end_location: str

    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None

    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    distance: Optional[float] = None
    status: str


class TripCreate(TripBase):
    pass


class TripUpdate(TripBase):
    pass


class TripResponse(TripBase):
    id: int

    class Config:
        from_attributes = True


class RouteResponse(BaseModel):
    pickup_location: str
    destination: str
    distance: str
    estimated_travel_time: str
    route_summary: str