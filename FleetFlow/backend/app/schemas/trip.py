from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.enums.trip_status import TripStatus


class TripBase(BaseModel):
    shipment_id: int
    pickup_location: str
    delivery_location: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    shipment_id: int | None = None
    pickup_location: str | None = None
    delivery_location: str | None = None
    scheduled_start_time: datetime | None = None
    scheduled_end_time: datetime | None = None
    trip_status: TripStatus | None = None


class TripResponse(TripBase):
    id: int
    driver_id: int
    vehicle_id: int
    trip_status: TripStatus
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)