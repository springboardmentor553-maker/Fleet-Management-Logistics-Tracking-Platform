from datetime import datetime

from app.models import TripStatus
from app.schemas.common import ORMModel


class TripBase(ORMModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    pickup_latitude: float | None = None
    pickup_longitude: float | None = None
    destination_latitude: float | None = None
    destination_longitude: float | None = None
    scheduled_start_time: datetime | None = None
    scheduled_end_time: datetime | None = None


class TripCreate(TripBase):
    status: TripStatus = TripStatus.SCHEDULED


class TripUpdate(ORMModel):
    shipment_id: int | None = None
    driver_id: int | None = None
    vehicle_id: int | None = None
    pickup_location: str | None = None
    destination: str | None = None
    pickup_latitude: float | None = None
    pickup_longitude: float | None = None
    destination_latitude: float | None = None
    destination_longitude: float | None = None
    scheduled_start_time: datetime | None = None
    scheduled_end_time: datetime | None = None
    status: TripStatus | None = None


class TripRead(TripBase):
    id: int
    status: TripStatus
    created_at: datetime | None = None
