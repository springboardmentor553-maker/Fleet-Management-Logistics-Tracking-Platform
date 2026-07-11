from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TrackingPingCreate(BaseModel):
    shipment_id: int
    vehicle_id: int
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    speed_kmh: float = Field(ge=0, default=0)


class TrackingPingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    vehicle_id: int
    latitude: float
    longitude: float
    speed_kmh: float
    recorded_at: datetime


class LatestPositionOut(BaseModel):
    shipment_id: int
    latitude: float
    longitude: float
    speed_kmh: float
    recorded_at: datetime
