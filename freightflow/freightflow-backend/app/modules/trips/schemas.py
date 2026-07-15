
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.common.enums import TripStatus


class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str = Field(min_length=2, max_length=180)
    destination: str = Field(min_length=2, max_length=180)
    scheduled_start_time: datetime
    scheduled_end_time: datetime

    @model_validator(mode="after")
    def _check_time_window(self) -> "TripCreate":
        if self.scheduled_end_time <= self.scheduled_start_time:
            raise ValueError("scheduled_end_time must be after scheduled_start_time")
        return self


class TripUpdate(BaseModel):
    driver_id: int | None = None
    vehicle_id: int | None = None
    pickup_location: str | None = Field(default=None, min_length=2, max_length=180)
    destination: str | None = Field(default=None, min_length=2, max_length=180)
    scheduled_start_time: datetime | None = None
    scheduled_end_time: datetime | None = None
    status: TripStatus | None = None


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    status: TripStatus
    created_at: datetime
