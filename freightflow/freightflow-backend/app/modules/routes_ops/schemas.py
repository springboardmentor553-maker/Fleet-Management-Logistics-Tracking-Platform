from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Waypoint(BaseModel):
    label: str
    latitude: float
    longitude: float


class TripRouteCreate(BaseModel):
    shipment_id: int
    waypoints: list[Waypoint] = Field(min_length=2)
    distance_km: float = Field(gt=0)
    estimated_duration_min: int = Field(gt=0)


class TripRouteUpdate(BaseModel):
    waypoints: list[Waypoint] | None = None
    distance_km: float | None = Field(default=None, gt=0)
    estimated_duration_min: int | None = Field(default=None, gt=0)


class TripRouteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    waypoints: list[Waypoint]
    distance_km: float
    estimated_duration_min: int
    planned_by: int | None
    created_at: datetime
