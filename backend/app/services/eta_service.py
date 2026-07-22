"""
ETA Calculation Service — app/services/eta_service.py

Responsible solely for computing the Estimated Time of Arrival for a Trip.

It reuses:
  - The existing Route Service (generate_route) for distance and duration.
  - Trip.scheduled_start_time from the database as the departure baseline.

Returns a dict with:
  - distance_km               (float)
  - estimated_duration_minutes (float)
  - estimated_arrival_time    (ISO-8601 datetime string)
  - eta_readable              (human-friendly string, e.g. "Tue, 22 Jul 2026 14:30:00")
"""
import logging
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.services.route_service import generate_route
from app.services.geocoding_service import geocode_location

logger = logging.getLogger("fleetflow.eta_service")


def calculate_eta(trip_id: int, db: Session) -> dict:
    """
    Calculate the ETA for an existing trip.

    Parameters
    ----------
    trip_id : int
        Primary key of the Trip row.
    db : Session
        Active SQLAlchemy database session.

    Returns
    -------
    dict
        {
            "distance_km": float,
            "estimated_duration_minutes": float,
            "estimated_arrival_time": str,   # ISO-8601
            "eta_readable": str,             # human-friendly
        }

    Raises
    ------
    HTTPException 404
        When the trip does not exist.
    HTTPException 503 / 502 / 422
        Propagated from the Route Service when routing fails.
    """
    # 1. Load the trip
    trip: Trip | None = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        logger.warning("calculate_eta — trip %d not found", trip_id)
        raise HTTPException(status_code=404, detail="Trip not found")

    # 2. Ensure coordinates are present; geocode on-the-fly if missing
    coords_missing = any(
        v is None
        for v in [
            trip.pickup_latitude,
            trip.pickup_longitude,
            trip.destination_latitude,
            trip.destination_longitude,
        ]
    )
    if coords_missing:
        logger.info(
            "calculate_eta — coordinates missing for trip %d, geocoding now",
            trip_id,
        )
        pickup_coords = geocode_location(trip.pickup_location)
        destination_coords = geocode_location(trip.destination)

        trip.pickup_latitude = pickup_coords["latitude"]
        trip.pickup_longitude = pickup_coords["longitude"]
        trip.destination_latitude = destination_coords["latitude"]
        trip.destination_longitude = destination_coords["longitude"]
        db.commit()
        db.refresh(trip)

    # 3. Call the existing Route Service — reuse without duplication
    logger.info(
        "calculate_eta — calling route service for trip %d: "
        "(%.6f, %.6f) -> (%.6f, %.6f)",
        trip_id,
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude,
    )
    route_data = generate_route(
        pickup_latitude=trip.pickup_latitude,
        pickup_longitude=trip.pickup_longitude,
        destination_latitude=trip.destination_latitude,
        destination_longitude=trip.destination_longitude,
    )

    distance_km: float = route_data["distance_km"]
    estimated_duration_minutes: float = route_data["estimated_duration_minutes"]

    # 4. Calculate ETA: scheduled_start_time + estimated travel duration
    departure: datetime = trip.scheduled_start_time
    estimated_arrival: datetime = departure + timedelta(minutes=estimated_duration_minutes)

    estimated_arrival_time_iso: str = estimated_arrival.isoformat()
    eta_readable: str = estimated_arrival.strftime("%a, %d %b %Y %H:%M:%S")

    logger.info(
        "calculate_eta — trip %d: %.2f km, %.2f min, ETA %s",
        trip_id,
        distance_km,
        estimated_duration_minutes,
        eta_readable,
    )

    return {
        "distance_km": distance_km,
        "estimated_duration_minutes": estimated_duration_minutes,
        "estimated_arrival_time": estimated_arrival_time_iso,
        "eta_readable": eta_readable,
    }
