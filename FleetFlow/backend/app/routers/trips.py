"""Trip CRUD router – Milestone 3 + Google Maps Tasks.

Responsibilities:
  - Full CRUD for the trips table.
  - Validates that referenced shipment, driver, and vehicle exist.
  - Prevents double-assignment: a driver or vehicle already on an active trip
    (SCHEDULED or IN_PROGRESS) cannot be assigned to a new trip.
  - Prevents a shipment from being assigned to more than one trip.
  - Geocodes pickup and destination on trip creation (Task 3).
  - GET /{trip_id}/route: returns distance, duration, and polyline via
    Google Directions API (Task 4 & 5).
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import (
    Driver,
    RoleEnum,
    Shipment,
    Trip,
    TripStatusEnum,
    User,
    Vehicle,
)
from app.schemas.trip import RouteResponse, TripCreate, TripRead, TripUpdate
from app.services.directions import DirectionsError, get_route
from app.services.geocoding import GeocodingError, geocode_location
from app.services.security import get_current_user, require_roles

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Active-trip status set – used in double-assignment guards
# ---------------------------------------------------------------------------
_ACTIVE_STATUSES = {TripStatusEnum.SCHEDULED, TripStatusEnum.IN_PROGRESS}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _get_trip_or_404(db: Session, trip_id: int) -> Trip:
    """Fetch a trip by primary key or raise HTTP 404."""
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with id={trip_id} not found",
        )
    return trip


def _validate_shipment(db: Session, shipment_id: int) -> Shipment:
    """Ensure the referenced shipment exists, else raise 404."""
    shipment = db.get(Shipment, shipment_id)
    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment with id={shipment_id} not found",
        )
    return shipment


def _validate_driver(db: Session, driver_id: int) -> Driver:
    """Ensure the referenced driver exists, else raise 404."""
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with id={driver_id} not found",
        )
    return driver


def _validate_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    """Ensure the referenced vehicle exists, else raise 404."""
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with id={vehicle_id} not found",
        )
    return vehicle


def _check_shipment_not_already_in_trip(
    db: Session, shipment_id: int, exclude_trip_id: int | None = None
) -> None:
    """Raise 409 if the shipment is already linked to an existing trip."""
    query = db.query(Trip).filter(Trip.shipment_id == shipment_id)
    if exclude_trip_id is not None:
        query = query.filter(Trip.id != exclude_trip_id)
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Shipment id={shipment_id} is already assigned to "
                f"trip id={existing.id}. A shipment can only belong to one trip."
            ),
        )


def _check_driver_not_active(
    db: Session, driver_id: int, exclude_trip_id: int | None = None
) -> None:
    """Raise 409 if the driver already has an active (SCHEDULED or IN_PROGRESS) trip."""
    query = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status.in_(_ACTIVE_STATUSES),
    )
    if exclude_trip_id is not None:
        query = query.filter(Trip.id != exclude_trip_id)
    active_trip = query.first()
    if active_trip:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Driver id={driver_id} already has an active trip "
                f"(id={active_trip.id}, status={active_trip.status.value}). "
                "Complete or cancel the existing trip before assigning a new one."
            ),
        )


def _check_vehicle_not_active(
    db: Session, vehicle_id: int, exclude_trip_id: int | None = None
) -> None:
    """Raise 409 if the vehicle is already on an active (SCHEDULED or IN_PROGRESS) trip."""
    query = db.query(Trip).filter(
        Trip.vehicle_id == vehicle_id,
        Trip.status.in_(_ACTIVE_STATUSES),
    )
    if exclude_trip_id is not None:
        query = query.filter(Trip.id != exclude_trip_id)
    active_trip = query.first()
    if active_trip:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Vehicle id={vehicle_id} already has an active trip "
                f"(id={active_trip.id}, status={active_trip.status.value}). "
                "Complete or cancel the existing trip before assigning a new one."
            ),
        )


# ---------------------------------------------------------------------------
# CRUD Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=TripRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new trip",
    description=(
        "Creates a trip and assigns a shipment, driver, and vehicle to it. "
        "Validates that all referenced entities exist and that neither the driver "
        "nor the vehicle is currently on an active trip (SCHEDULED or IN_PROGRESS). "
        "A shipment can only be assigned to one trip at a time."
    ),
    dependencies=[
        Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER))
    ],
)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
) -> TripRead:
    # --- Validate referenced entities exist ---
    _validate_shipment(db, payload.shipment_id)
    _validate_driver(db, payload.driver_id)
    _validate_vehicle(db, payload.vehicle_id)

    # --- Prevent double assignment ---
    _check_shipment_not_already_in_trip(db, payload.shipment_id)
    _check_driver_not_active(db, payload.driver_id)
    _check_vehicle_not_active(db, payload.vehicle_id)

    trip_data = payload.model_dump()

    # --- Geocode pickup and destination locations (best-effort) ---
    try:
        p_lat, p_lng = geocode_location(payload.pickup_location)
        trip_data["pickup_lat"] = p_lat
        trip_data["pickup_lng"] = p_lng
    except (GeocodingError, Exception) as exc:
        logger.warning("Geocoding pickup failed: %s", exc)

    try:
        d_lat, d_lng = geocode_location(payload.destination)
        trip_data["destination_lat"] = d_lat
        trip_data["destination_lng"] = d_lng
    except (GeocodingError, Exception) as exc:
        logger.warning("Geocoding destination failed: %s", exc)

    trip = Trip(**trip_data)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return TripRead.model_validate(trip)


@router.get(
    "",
    response_model=list[TripRead],
    summary="List all trips",
)
def list_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TripRead]:
    trips = db.query(Trip).order_by(Trip.id.asc()).all()
    return [TripRead.model_validate(t) for t in trips]


@router.get(
    "/{trip_id}",
    response_model=TripRead,
    summary="Get a trip by ID",
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripRead:
    trip = _get_trip_or_404(db, trip_id)
    return TripRead.model_validate(trip)


@router.put(
    "/{trip_id}",
    response_model=TripRead,
    summary="Update a trip",
    description=(
        "Update any trip field. If changing driver_id or vehicle_id, "
        "the same double-assignment validation is re-applied. "
        "If changing shipment_id, the single-trip-per-shipment rule is re-checked."
    ),
    dependencies=[
        Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER))
    ],
)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
) -> TripRead:
    trip = _get_trip_or_404(db, trip_id)
    updates = payload.model_dump(exclude_unset=True)

    # Re-validate only changed FK fields to avoid false conflicts on the same trip
    if "shipment_id" in updates and updates["shipment_id"] is not None:
        _validate_shipment(db, updates["shipment_id"])
        _check_shipment_not_already_in_trip(db, updates["shipment_id"], exclude_trip_id=trip_id)

    if "driver_id" in updates and updates["driver_id"] is not None:
        _validate_driver(db, updates["driver_id"])
        _check_driver_not_active(db, updates["driver_id"], exclude_trip_id=trip_id)

    if "vehicle_id" in updates and updates["vehicle_id"] is not None:
        _validate_vehicle(db, updates["vehicle_id"])
        _check_vehicle_not_active(db, updates["vehicle_id"], exclude_trip_id=trip_id)

    for field, value in updates.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return TripRead.model_validate(trip)


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a trip",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
) -> None:
    trip = _get_trip_or_404(db, trip_id)
    db.delete(trip)
    db.commit()


# ---------------------------------------------------------------------------
# Route Endpoint – Task 5
# ---------------------------------------------------------------------------

@router.get(
    "/{trip_id}/route",
    response_model=RouteResponse,
    summary="Get route details for a trip",
    description=(
        "Returns distance, estimated travel time, route summary, and encoded polyline "
        "for the trip's pickup → destination using the Google Directions API. "
        "If coordinates are not yet stored, geocoding is performed on the fly and "
        "persisted to the trip record."
    ),
)
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RouteResponse:
    trip = _get_trip_or_404(db, trip_id)

    # --- Ensure we have coordinates; geocode on-the-fly if missing ---
    coords_updated = False

    if trip.pickup_lat is None or trip.pickup_lng is None:
        try:
            trip.pickup_lat, trip.pickup_lng = geocode_location(trip.pickup_location)
            coords_updated = True
        except (GeocodingError, Exception) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not geocode pickup location '{trip.pickup_location}': {exc}",
            ) from exc

    if trip.destination_lat is None or trip.destination_lng is None:
        try:
            trip.destination_lat, trip.destination_lng = geocode_location(trip.destination)
            coords_updated = True
        except (GeocodingError, Exception) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not geocode destination '{trip.destination}': {exc}",
            ) from exc

    if coords_updated:
        db.commit()
        db.refresh(trip)

    # --- Fetch route from Google Directions API ---
    try:
        route = get_route(
            pickup_lat=trip.pickup_lat,
            pickup_lng=trip.pickup_lng,
            destination_lat=trip.destination_lat,
            destination_lng=trip.destination_lng,
        )
    except DirectionsError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Directions API error: {exc}",
        ) from exc

    return RouteResponse(
        trip_id=trip.id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
        pickup_lat=trip.pickup_lat,
        pickup_lng=trip.pickup_lng,
        destination_lat=trip.destination_lat,
        destination_lng=trip.destination_lng,
        distance=route.distance_text,
        distance_meters=route.distance_meters,
        estimated_travel_time=route.duration_text,
        duration_seconds=route.duration_seconds,
        route_summary=route.summary,
        polyline=route.polyline,
        start_address=route.start_address,
        end_address=route.end_address,
    )
