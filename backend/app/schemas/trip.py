from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ============================================================
# BASE
# ============================================================

class TripBase(BaseModel):

    shipment_id: int

    vehicle_id: int

    driver_id: int

    start_location: str

    end_location: str

    departure_time: datetime

    expected_arrival: Optional[datetime] = None

    status: str = "Scheduled"

    current_latitude: Optional[str] = None

    current_longitude: Optional[str] = None

    destination_latitude: Optional[str] = None

    destination_longitude: Optional[str] = None

    actual_arrival: Optional[datetime] = None

    distance: Optional[float] = None


# ============================================================
# CREATE
# ============================================================

class TripCreate(TripBase):

    pass


# ============================================================
# UPDATE
# ============================================================

class TripUpdate(BaseModel):

    shipment_id: Optional[int] = None

    vehicle_id: Optional[int] = None

    driver_id: Optional[int] = None

    start_location: Optional[str] = None

    end_location: Optional[str] = None

    departure_time: Optional[datetime] = None

    expected_arrival: Optional[datetime] = None

    status: Optional[str] = None

    current_latitude: Optional[str] = None

    current_longitude: Optional[str] = None

    destination_latitude: Optional[str] = None

    destination_longitude: Optional[str] = None

    actual_arrival: Optional[datetime] = None

    distance: Optional[float] = None


# ============================================================
# STATUS UPDATE
# ============================================================

class TripStatusUpdate(BaseModel):

    status: str


# ============================================================
# LOCATION UPDATE
# ============================================================

class TripLocationUpdate(BaseModel):

    current_latitude: str

    current_longitude: str


# ============================================================
# RESPONSE
# ============================================================

class TripResponse(TripBase):

    id: int

    created_at: Optional[datetime] = None

    class Config:

        from_attributes = True