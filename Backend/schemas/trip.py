from datetime import datetime

from pydantic import BaseModel

from app.models.trip import TripStatus


class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    route_id: int
    start_date: datetime | None = None
    expected_end_date: datetime | None = None
    notes: str | None = None


class TripUpdate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    route_id: int
    start_date: datetime | None = None
    expected_end_date: datetime | None = None
    actual_end_date: datetime | None = None
    status: TripStatus
    notes: str | None = None


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

    start_date: datetime | None
    expected_end_date: datetime | None
    actual_end_date: datetime | None

    status: TripStatus
    notes: str | None

    created_at: datetime

    class Config:
        from_attributes = True