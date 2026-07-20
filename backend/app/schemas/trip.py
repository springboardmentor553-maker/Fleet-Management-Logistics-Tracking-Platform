from datetime import datetime
from pydantic import BaseModel, ConfigDict

# ==========================================================
# Base Schema
# ==========================================================

class TripBase(BaseModel):

    shipment_id: int

    driver_id: int

    vehicle_id: int

    pickup_location: str

    destination: str

    # ======================================================
    # Google Maps Coordinates
    # ======================================================

    pickup_latitude: float | None = None

    pickup_longitude: float | None = None

    destination_latitude: float | None = None

    destination_longitude: float | None = None

    # ======================================================
    # Schedule
    # ======================================================

    scheduled_start_time: datetime

    scheduled_end_time: datetime

    # ======================================================
    # Status
    # ======================================================

    trip_status: str


# ==========================================================
# Create Trip
# ==========================================================

class TripCreate(TripBase):
    pass


# ==========================================================
# Update Trip
# ==========================================================

class TripUpdate(TripBase):
    pass


# ==========================================================
# Response Schema
# ==========================================================

class TripResponse(TripBase):

    id: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )