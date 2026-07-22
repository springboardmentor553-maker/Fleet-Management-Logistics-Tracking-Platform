"""
Vehicle Simulation Service — app/websocket/simulation.py

Simulates vehicle movement along the REAL road route returned by
OpenRouteService.  All coordinates come from the ORS polyline — no
random values are ever generated.

Workflow
--------
1. Load the Trip from the database.
2. Geocode pickup / destination if coordinates are missing (reuses
   existing geocoding_service).
3. Call the existing route_service.generate_route() in a thread-pool
   executor so the blocking HTTP call does not stall the event loop.
4. Decode the ORS-encoded polyline (Google Polyline format) using the
   ``polyline`` library → list of (lat, lon) tuples.
5. Walk through waypoints, broadcasting a location_update every 3 s.
6. Stop automatically when:
   - the last waypoint is reached, OR
   - no clients remain connected to this trip_id.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import polyline as polyline_lib

from app.database import SessionLocal
from app.models.trip import Trip
from app.services.geocoding_service import geocode_location
from app.services.route_service import generate_route

if TYPE_CHECKING:
    from app.websocket.connection_manager import ConnectionManager

logger = logging.getLogger("fleetflow.websocket.simulation")

# Seconds between each coordinate broadcast
STEP_INTERVAL: float = 3.0


async def simulate_trip_movement(
    trip_id: int,
    manager: "ConnectionManager",
) -> None:
    """
    Coroutine that streams real vehicle positions for trip_id.

    Meant to be scheduled as an asyncio.Task.  Handles
    asyncio.CancelledError gracefully (no exception propagation).

    Parameters
    ----------
    trip_id : int
        Primary key of the Trip row to simulate.
    manager : ConnectionManager
        Singleton connection manager used to broadcast and check
        whether clients are still connected.
    """
    logger.info("ws.simulation — trip=%d  starting", trip_id)

    try:
        # ---------------------------------------------------------------
        # 1. Load trip and ensure coordinates are present
        # ---------------------------------------------------------------
        waypoints = await asyncio.get_event_loop().run_in_executor(
            None, _load_route_waypoints, trip_id
        )

        if not waypoints:
            logger.warning(
                "ws.simulation — trip=%d  no waypoints, simulation aborted",
                trip_id,
            )
            return

        logger.info(
            "ws.simulation — trip=%d  route loaded, %d waypoints",
            trip_id,
            len(waypoints),
        )

        # ---------------------------------------------------------------
        # 2. Walk waypoints, broadcasting every STEP_INTERVAL seconds
        # ---------------------------------------------------------------
        for lat, lon in waypoints:
            # Stop if all clients have disconnected
            if manager.get_connection_count(trip_id) == 0:
                logger.info(
                    "ws.simulation — trip=%d  no clients, stopping simulation",
                    trip_id,
                )
                return

            payload = {
                "type": "location_update",
                "trip_id": trip_id,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await manager.broadcast_to_trip(trip_id, payload)
            await asyncio.sleep(STEP_INTERVAL)

        logger.info(
            "ws.simulation — trip=%d  destination reached, simulation complete",
            trip_id,
        )

    except asyncio.CancelledError:
        logger.info(
            "ws.simulation — trip=%d  simulation task cancelled", trip_id
        )
        # Re-raise so the task framework knows it was cancelled cleanly
        raise

    except Exception:
        logger.exception(
            "ws.simulation — trip=%d  unexpected error in simulation", trip_id
        )


# ---------------------------------------------------------------------------
# Synchronous helper — runs in a thread-pool executor
# ---------------------------------------------------------------------------

def _load_route_waypoints(trip_id: int) -> list[tuple[float, float]]:
    """
    Blocking function that:
    1. Opens a short-lived DB session.
    2. Loads the Trip row.
    3. Geocodes coordinates if missing (reuses geocoding_service).
    4. Calls route_service.generate_route() via ORS.
    5. Decodes the returned polyline string.
    6. Returns list of (lat, lon) tuples.

    All external services (Nominatim, ORS) are called synchronously here
    because this function is always called via run_in_executor().
    """
    db = SessionLocal()
    try:
        trip: Trip | None = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            logger.warning(
                "ws.simulation._load — trip=%d not found in DB", trip_id
            )
            return []

        # Geocode on-the-fly if coordinates are missing (reuses existing service)
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
                "ws.simulation._load — trip=%d  coordinates missing, geocoding",
                trip_id,
            )
            pickup_coords = geocode_location(trip.pickup_location)
            dest_coords = geocode_location(trip.destination)

            trip.pickup_latitude = pickup_coords["latitude"]
            trip.pickup_longitude = pickup_coords["longitude"]
            trip.destination_latitude = dest_coords["latitude"]
            trip.destination_longitude = dest_coords["longitude"]
            db.commit()
            db.refresh(trip)

        # Call the existing route service
        route_data = generate_route(
            pickup_latitude=trip.pickup_latitude,
            pickup_longitude=trip.pickup_longitude,
            destination_latitude=trip.destination_latitude,
            destination_longitude=trip.destination_longitude,
        )

        raw_polyline = route_data.get("polyline")
        if not raw_polyline:
            logger.warning(
                "ws.simulation._load — trip=%d  ORS returned no polyline",
                trip_id,
            )
            # Fall back to straight line between pickup and destination
            return [
                (trip.pickup_latitude, trip.pickup_longitude),
                (trip.destination_latitude, trip.destination_longitude),
            ]

        # Decode the ORS-encoded polyline (Google Polyline Algorithm)
        # polyline_lib.decode() returns list of (lat, lon) tuples
        waypoints: list[tuple[float, float]] = polyline_lib.decode(raw_polyline)

        if not waypoints:
            logger.warning(
                "ws.simulation._load — trip=%d  polyline decoded to 0 points",
                trip_id,
            )
            return [
                (trip.pickup_latitude, trip.pickup_longitude),
                (trip.destination_latitude, trip.destination_longitude),
            ]

        logger.info(
            "ws.simulation._load — trip=%d  decoded %d waypoints from polyline",
            trip_id,
            len(waypoints),
        )
        return waypoints

    except Exception:
        logger.exception(
            "ws.simulation._load — trip=%d  error loading route waypoints",
            trip_id,
        )
        return []

    finally:
        db.close()
