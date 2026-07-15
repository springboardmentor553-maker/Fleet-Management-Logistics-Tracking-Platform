"""Pydantic schemas for Trip endpoints (Milestone 3 – Tasks 1-5)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.core import TripStatusEnum


class TripCreate(BaseModel):
    """Fields required when creating a new trip."""

    shipment_id: int = Field(description="ID of the shipment to be transported")
    driver_id: int = Field(description="ID of the assigned driver")
    vehicle_id: int = Field(description="ID of the assigned vehicle")
    pickup_location: str = Field(min_length=1, examples=["Mumbai Warehouse, MH"])
    destination: str = Field(min_length=1, examples=["Delhi Hub, DL"])
    scheduled_start_time: datetime = Field(description="Planned departure time")
    scheduled_end_time: datetime | None = Field(
        default=None, description="Planned arrival time (optional)"
    )
    status: TripStatusEnum = Field(
        default=TripStatusEnum.SCHEDULED,
        description="Initial trip status; defaults to SCHEDULED",
    )


class TripUpdate(BaseModel):
    """All fields are optional – send only what you want to change."""

    shipment_id: int | None = None
    driver_id: int | None = None
    vehicle_id: int | None = None
    pickup_location: str | None = None
    destination: str | None = None
    scheduled_start_time: datetime | None = None
    scheduled_end_time: datetime | None = None
    status: TripStatusEnum | None = None


class TripRead(BaseModel):
    """Full representation returned by read endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int | None
    driver_id: int | None
    vehicle_id: int | None
    pickup_location: str
    destination: str
    # Coordinates – None until geocoded
    pickup_lat: float | None
    pickup_lng: float | None
    destination_lat: float | None
    destination_lng: float | None
    scheduled_start_time: datetime
    scheduled_end_time: datetime | None
    status: TripStatusEnum
    created_at: datetime


class RouteResponse(BaseModel):
    """Response schema for GET /trips/{trip_id}/route."""

    trip_id: int
    pickup_location: str
    destination: str
    pickup_lat: float
    pickup_lng: float
    destination_lat: float
    destination_lng: float
    distance: str = Field(description="Human-readable total distance, e.g. '1,234 km'")
    distance_meters: int = Field(description="Total distance in metres")
    estimated_travel_time: str = Field(description="Human-readable duration, e.g. '14 hours 32 mins'")
    duration_seconds: int = Field(description="Total travel time in seconds")
    route_summary: str = Field(description="Primary road/highway used, e.g. 'NH48'")
    polyline: str | None = Field(
        default=None,
        description="Google Maps encoded polyline for the full route (for map rendering)",
    )
    start_address: str = Field(description="Resolved address of the pickup point")
    end_address: str = Field(description="Resolved address of the destination")
