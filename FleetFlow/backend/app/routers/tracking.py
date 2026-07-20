"""Tracking & ETA router.

Endpoints
---------
GET /trips/{trip_id}/eta
    Returns ETA for a specific trip (distance, duration, estimated arrival).

GET /shipments/{tracking_number}/status
    Public-friendly shipment tracking: current status, driver, vehicle, ETA.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Driver, Shipment, Trip, User, Vehicle
from app.services.directions import DirectionsError, get_route
from app.services.eta_service import ETAResult, calculate_eta
from app.services.geocoding import GeocodingError, geocode_location
from app.services.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Response Schemas (inline – specific to this router)
# ---------------------------------------------------------------------------

class ETAResponse(BaseModel):
    """Response for GET /trips/{trip_id}/eta."""

    trip_id: int
    pickup_location: str
    destination: str
    distance: str = Field(description="Human-readable distance, e.g. '1,378.7 km'")
    distance_meters: int
    estimated_travel_duration: str = Field(description="e.g. '16 hr 53 min'")
    duration_seconds: int
    scheduled_departure: str = Field(description="ISO-formatted scheduled start time")
    estimated_arrival_time: str = Field(description="Human-readable ETA, e.g. '25 Jul 2026 11:30 UTC'")


class ShipmentTrackingResponse(BaseModel):
    """Response for GET /shipments/{tracking_number}/status."""

    tracking_number: str
    current_status: str
    pickup_location: str
    destination: str
    driver_name: str | None = Field(default=None, description="Full name of the assigned driver (email used as fallback)")
    vehicle_registration: str | None = Field(default=None, description="Vehicle registration number")
    estimated_arrival_time: str | None = Field(default=None, description="ETA if a trip and route exist")
    distance: str | None = None
    estimated_travel_duration: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_trip_coords(trip: Trip, db: Session) -> Trip:
    """Geocode pickup/destination if coordinates are missing, persist, return trip."""
    updated = False

    if trip.pickup_lat is None or trip.pickup_lng is None:
        try:
            trip.pickup_lat, trip.pickup_lng = geocode_location(trip.pickup_location)
            updated = True
        except (GeocodingError, Exception) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not geocode pickup '{trip.pickup_location}': {exc}",
            ) from exc

    if trip.destination_lat is None or trip.destination_lng is None:
        try:
            trip.destination_lat, trip.destination_lng = geocode_location(trip.destination)
            updated = True
        except (GeocodingError, Exception) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not geocode destination '{trip.destination}': {exc}",
            ) from exc

    if updated:
        db.commit()
        db.refresh(trip)

    return trip


def _fetch_route(trip: Trip) -> tuple:
    """Fetch OSRM route for a trip; returns (route_obj,) or raises 502."""
    try:
        return get_route(
            pickup_lat=trip.pickup_lat,
            pickup_lng=trip.pickup_lng,
            destination_lat=trip.destination_lat,
            destination_lng=trip.destination_lng,
            pickup_location=trip.pickup_location,
            destination_location=trip.destination,
        )
    except DirectionsError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Routing error: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Task 3 – ETA Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/trips/{trip_id}/eta",
    response_model=ETAResponse,
    summary="Get ETA for a trip",
    description=(
        "Calculates the Estimated Time of Arrival for the given trip. "
        "Uses OSRM to compute the driving distance and duration, then adds "
        "that duration to the trip's scheduled_start_time. "
        "Coordinates are geocoded on-the-fly and cached if not already stored."
    ),
    tags=["tracking"],
)
def get_trip_eta(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ETAResponse:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip id={trip_id} not found")

    trip = _ensure_trip_coords(trip, db)
    route = _fetch_route(trip)

    eta: ETAResult = calculate_eta(
        departure_time=trip.scheduled_start_time,
        duration_seconds=route.duration_seconds,
        distance_meters=route.distance_meters,
        distance_text=route.distance_text,
    )

    return ETAResponse(
        trip_id=trip.id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
        distance=eta.distance_text,
        distance_meters=eta.distance_meters,
        estimated_travel_duration=eta.duration_text,
        duration_seconds=eta.duration_seconds,
        scheduled_departure=trip.scheduled_start_time.isoformat(),
        estimated_arrival_time=eta.arrival_text,
    )


# ---------------------------------------------------------------------------
# Task 4 – Shipment Tracking Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/shipments/{tracking_number}/status",
    response_model=ShipmentTrackingResponse,
    summary="Track a shipment by tracking number",
    description=(
        "Returns the current status, assigned driver, vehicle, and ETA "
        "for a shipment identified by its tracking number (e.g. FLT100001). "
        "ETA is computed if the shipment has an associated trip with valid coordinates. "
        "If routing fails, ETA fields are returned as null rather than erroring the whole request."
    ),
    tags=["tracking"],
)
def track_shipment(
    tracking_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShipmentTrackingResponse:
    shipment: Shipment | None = (
        db.query(Shipment)
        .filter(Shipment.tracking_number == tracking_number.upper())
        .first()
    )
    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail=f"No shipment found with tracking number '{tracking_number}'",
        )

    # --- Driver name ---
    driver_name: str | None = None
    if shipment.driver_id:
        driver: Driver | None = db.get(Driver, shipment.driver_id)
        if driver and driver.user:
            driver_name = driver.user.email  # email as display name (no separate name field)

    # --- Vehicle registration ---
    vehicle_reg: str | None = None
    if shipment.vehicle_id:
        vehicle: Vehicle | None = db.get(Vehicle, shipment.vehicle_id)
        if vehicle:
            vehicle_reg = vehicle.registration_number

    # --- ETA (best-effort via the shipment's linked trip) ---
    eta_text: str | None = None
    distance_text: str | None = None
    duration_text: str | None = None

    trip: Trip | None = shipment.trip  # uses the SQLAlchemy relationship
    if trip:
        try:
            trip = _ensure_trip_coords(trip, db)
            route = _fetch_route(trip)
            eta_result = calculate_eta(
                departure_time=trip.scheduled_start_time,
                duration_seconds=route.duration_seconds,
                distance_meters=route.distance_meters,
                distance_text=route.distance_text,
            )
            eta_text = eta_result.arrival_text
            distance_text = eta_result.distance_text
            duration_text = eta_result.duration_text
        except HTTPException:
            # Routing unavailable – return tracking info without ETA
            logger.warning("Could not compute ETA for shipment %s", tracking_number)

    return ShipmentTrackingResponse(
        tracking_number=shipment.tracking_number,
        current_status=shipment.status.value,
        pickup_location=shipment.pickup_location,
        destination=shipment.delivery_location,
        driver_name=driver_name,
        vehicle_registration=vehicle_reg,
        estimated_arrival_time=eta_text,
        distance=distance_text,
        estimated_travel_duration=duration_text,
    )
