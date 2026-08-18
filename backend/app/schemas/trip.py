from datetime import datetime
from pydantic import model_validator
from app.schemas.common import ORMModel


# =========================================================
# TRIP BASE
# =========================================================

class TripBase(ORMModel):

    shipment_id: int

    driver_id: int

    vehicle_id: int


    # =====================================================
    # ROUTE
    # =====================================================

    pickup_location: str

    destination: str


    # =====================================================
    # PICKUP COORDINATES
    # =====================================================

    pickup_latitude: str | None = None

    pickup_longitude: str | None = None


    # =====================================================
    # DESTINATION COORDINATES
    # =====================================================

    destination_latitude: str | None = None

    destination_longitude: str | None = None


    # =====================================================
    # SCHEDULE
    # =====================================================

    scheduled_start_time: datetime

    scheduled_end_time: datetime


    # =====================================================
    # STATUS
    # =====================================================

    trip_status: str = "Scheduled"


# =========================================================
# CREATE
# =========================================================

class TripCreate(TripBase):
    pass


# =========================================================
# UPDATE
# =========================================================

class TripUpdate(ORMModel):

    shipment_id: int | None = None

    driver_id: int | None = None

    vehicle_id: int | None = None


    # =====================================================
    # ROUTE
    # =====================================================

    pickup_location: str | None = None

    destination: str | None = None


    # =====================================================
    # PICKUP COORDINATES
    # =====================================================

    pickup_latitude: str | None = None

    pickup_longitude: str | None = None


    # =====================================================
    # DESTINATION COORDINATES
    # =====================================================

    destination_latitude: str | None = None

    destination_longitude: str | None = None


    # =====================================================
    # SCHEDULE
    # =====================================================

    scheduled_start_time: datetime | None = None

    scheduled_end_time: datetime | None = None


    # =====================================================
    # STATUS
    # =====================================================

    trip_status: str | None = None


# =========================================================
# READ
# =========================================================

class TripRead(TripBase):

    id: int
    driver_name: str | None = None
    vehicle_number: str | None = None