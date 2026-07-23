from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TripBase(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int

    start_location: str
    end_location: str

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