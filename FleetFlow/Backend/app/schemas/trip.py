from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

TRIP_STATUSES = {"scheduled", "started", "completed", "cancelled"}


class TripCreate(BaseModel):
    shipment_id: int = Field(..., example=1)
    driver_id:   int = Field(..., example=1)
    vehicle_id:  int = Field(..., example=1)


class TripStatusUpdate(BaseModel):
    status: str = Field(..., example="started", description="scheduled | started | completed | cancelled")


class TripResponse(BaseModel):
    id:                   int
    shipment_id:          int
    driver_id:            int
    vehicle_id:           int
    start_time:           Optional[datetime]
    end_time:             Optional[datetime]
    status:               str
    created_at:           datetime
    shipment_origin:      Optional[str] = None
    shipment_destination: Optional[str] = None
    driver_name:          Optional[str] = None
    vehicle_plate:        Optional[str] = None

    model_config = {"from_attributes": True}
