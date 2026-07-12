from pydantic import BaseModel
from typing import Optional


class TripCreate(BaseModel):
    shipment_id: int
    vehicle_id: int
    driver_id: int
    start_location: str
    end_location: str
    departure_time: str
    expected_arrival: str
    status: str = "Scheduled"
    current_latitude: str
    current_longitude: str
    destination_latitude: str
    destination_longitude: str


class TripUpdate(BaseModel):
    shipment_id: int | None = None
    vehicle_id: int | None = None
    driver_id: int | None = None
    start_location: str | None = None
    end_location: str | None = None
    departure_time: str | None = None
    expected_arrival: str | None = None
    status: str | None = None
    current_latitude: str | None = None
    current_longitude: str | None = None
    destination_latitude: str | None = None
    destination_longitude: str | None = None


class TripResponse(BaseModel):
    id: int
    shipment_id: int
    vehicle_id: int
    driver_id: int
    start_location: str
    end_location: str
    departure_time: str
    expected_arrival: str
    status: str
    current_latitude: str
    current_longitude: str
    destination_latitude: str
    destination_longitude: str

    class Config:
        from_attributes = True