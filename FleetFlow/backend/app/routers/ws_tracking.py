"""
WebSocket Tracking Router — Tasks 1, 3 & 4
============================================

Endpoint
--------
  WS  /ws/tracking/{trip_id}

Behaviour
---------
1. On connect  → immediately send the current trip snapshot (status, coords).
2. Background  → every LOCATION_INTERVAL seconds simulate vehicle movement
                 along the route and broadcast the updated lat/lng to all
                 connected clients for that trip (Task 3).
3. REST hook   → broadcast_shipment_status() is called by the shipments
                 router whenever a status field changes (Task 4).

Message format (JSON)
---------------------
Location update:
  {
    "event":    "location_update",
    "trip_id":  1,
    "lat":      19.1234,
    "lng":      72.9876,
    "timestamp":"2026-07-22T00:00:00Z"
  }

Shipment status update:
  {
    "event":          "status_update",
    "trip_id":        1,
    "tracking_number":"FLT100002",
    "status":         "IN_TRANSIT",
    "timestamp":      "2026-07-22T00:00:00Z"
  }

Initial snapshot (sent once on connect):
  {
    "event":          "snapshot",
    "trip_id":        1,
    "status":         "IN_PROGRESS",
    "pickup_location":"Delhi, NCR",
    "destination":    "Gurgaon, Haryana",
    "lat":            28.7041,
    "lng":            77.1025,
    "tracking_number":"FLT100002",
    "shipment_status":"IN_TRANSIT",
    "clients_watching":2
  }

Error message (trip not found):
  { "event": "error", "detail": "Trip id=99 not found" }
"""

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


from app.connection_manager import manager
from app.database import SessionLocal
from app.models.trip import Trip
from app.models.shipment import Shipment

logger = logging.getLogger(__name__)
router = APIRouter()

# ── tuneable constants ───────────────────────────────────────────────────────
LOCATION_INTERVAL = 3       # seconds between simulated GPS pings
# ────────────────────────────────────────────────────────────────────────────



# ─────────────────────────────────────────────────────────────────────────────
# Core helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_trip_snapshot(trip_id: int) -> dict | None:
    """Load the trip + shipment from DB and build the initial snapshot dict."""
    db = SessionLocal()
    try:
        trip: Trip | None = db.get(Trip, trip_id)
        if trip is None:
            return None

        shipment: Shipment | None = trip.shipment
        return {
            "event":           "snapshot",
            "trip_id":         trip.id,
            "status":          trip.status.value,
            "pickup_location": trip.pickup_location,
            "destination":     trip.destination,
            "lat":             trip.pickup_lat,
            "lng":             trip.pickup_lng,
            "destination_lat": trip.destination_lat,
            "destination_lng": trip.destination_lng,
            "tracking_number": shipment.tracking_number if shipment else None,
            "shipment_status": shipment.status.value   if shipment else None,
            "clients_watching": manager.client_count(trip_id),
            "timestamp":       _now_iso(),
        }
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Route fetching + polyline decoding
# ─────────────────────────────────────────────────────────────────────────────

def _decode_polyline(encoded: str) -> list[tuple[float, float]]:

    """Decode a Google-encoded polyline string into (lat, lng) pairs.

    OSRM returns geometry in this format when geometries=polyline is requested.
    Algorithm reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    """
    coords: list[tuple[float, float]] = []
    index, lat, lng = 0, 0, 0
    length = len(encoded)

    while index < length:
        # Decode latitude
        result, shift = 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        # Decode longitude
        result, shift = 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coords.append((lat / 1e5, lng / 1e5))

    return coords


def _fetch_route_waypoints(
    pickup_lat: float, pickup_lng: float,
    dest_lat: float,   dest_lng: float,
) -> list[tuple[float, float]]:
    """Call the OSRM demo server and return the decoded road waypoints.

    Falls back to a direct straight-line path (just start + end) on any error
    so the simulation keeps working even without internet.
    """
    try:
        import httpx
        coords = f"{pickup_lng},{pickup_lat};{dest_lng},{dest_lat}"
        url    = f"http://router.project-osrm.org/route/v1/driving/{coords}"
        params = {"overview": "full", "geometries": "polyline", "steps": "false"}
        headers = {"User-Agent": "FleetFlow/1.0 (simulation)"}

        resp = httpx.get(url, params=params, headers=headers, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            raise ValueError("No routes returned")

        polyline = data["routes"][0]["geometry"]
        waypoints = _decode_polyline(polyline)
        logger.info("OSRM route fetched: %d waypoints", len(waypoints))
        return waypoints

    except Exception as exc:
        logger.warning("OSRM route fetch failed (%s) — using straight-line fallback", exc)
        return [(pickup_lat, pickup_lng), (dest_lat, dest_lng)]


# ─────────────────────────────────────────────────────────────────────────────
# Background task — live location simulation (Task 3)
# ─────────────────────────────────────────────────────────────────────────────

async def _simulate_location(trip_id: int, snapshot: dict) -> None:
    """Runs as a separate asyncio task for each unique trip_id.

    Steps through the actual OSRM road waypoints sequentially so the vehicle
    marker moves along the same route that Leaflet Routing Machine draws.
    Stops automatically when no more clients are watching.
    """
    pickup_lat = snapshot.get("lat")  or 0.0
    pickup_lng = snapshot.get("lng")  or 0.0
    dest_lat   = snapshot.get("destination_lat") or pickup_lat
    dest_lng   = snapshot.get("destination_lng") or pickup_lng

    logger.info("Location simulation started for trip_id=%s", trip_id)

    # Fetch real road waypoints from OSRM (runs in thread to avoid blocking loop)
    loop = asyncio.get_event_loop()
    waypoints: list[tuple[float, float]] = await loop.run_in_executor(
        None,
        _fetch_route_waypoints,
        pickup_lat, pickup_lng, dest_lat, dest_lng,
    )

    # How many waypoints to skip per tick so the demo completes in ~2 minutes.
    # E.g. 120 waypoints / (120s / 3s) = 3 waypoints per tick.
    total_points = len(waypoints)
    ticks_target = max(1, 120 // LOCATION_INTERVAL)          # ~40 ticks
    step         = max(1, total_points // ticks_target)       # waypoints per tick
    current_idx  = 0

    while manager.client_count(trip_id) > 0:
        await asyncio.sleep(LOCATION_INTERVAL)

        if manager.client_count(trip_id) == 0:
            break

        # Advance along the road waypoints
        current_idx = min(current_idx + step, total_points - 1)
        lat, lng = waypoints[current_idx]

        payload = {
            "event":     "location_update",
            "trip_id":   trip_id,
            "lat":       round(lat, 6),
            "lng":       round(lng, 6),
            "timestamp": _now_iso(),
        }
        await manager.broadcast(trip_id, payload)
        logger.debug("Location broadcast trip_id=%s  lat=%s lng=%s  step=%d/%d",
                     trip_id, lat, lng, current_idx, total_points - 1)

        # Stop looping once we reach the destination
        if current_idx >= total_points - 1:
            logger.info("Simulation reached destination for trip_id=%s", trip_id)
            break

    logger.info("Location simulation stopped for trip_id=%s", trip_id)



# Track which trips already have a simulation task running
_simulation_tasks: dict[int, asyncio.Task] = {}


def _ensure_simulation_running(trip_id: int, snapshot: dict) -> None:
    """Start the location simulation task if not already running for this trip."""
    existing = _simulation_tasks.get(trip_id)
    if existing is None or existing.done():
        task = asyncio.ensure_future(_simulate_location(trip_id, snapshot))
        _simulation_tasks[trip_id] = task


# ─────────────────────────────────────────────────────────────────────────────
# Task 4 — Public helper: broadcast a shipment status update
# ─────────────────────────────────────────────────────────────────────────────

async def broadcast_shipment_status(
    trip_id: int | None,
    tracking_number: str,
    new_status: str,
) -> None:
    """
    Called by the shipments router (PATCH endpoint) after a status change.
    If trip_id is None (shipment not yet linked to a trip), this is a no-op
    because there are no WS channels open for unlinked shipments.
    """
    if trip_id is None:
        return

    payload = {
        "event":           "status_update",
        "trip_id":         trip_id,
        "tracking_number": tracking_number,
        "status":          new_status,
        "timestamp":       _now_iso(),
    }
    await manager.broadcast(trip_id, payload)
    logger.info(
        "Shipment status broadcast  trip_id=%s  tracking=%s  status=%s",
        trip_id, tracking_number, new_status,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 1 — WebSocket endpoint: /ws/tracking/{trip_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.websocket("/ws/tracking/{trip_id}")
async def tracking_websocket(websocket: WebSocket, trip_id: int) -> None:
    """
    Real-time tracking WebSocket for a specific trip.

    Lifecycle:
      CONNECT  → accept, validate trip, send snapshot, start/join simulation
      RECEIVE  → echo back any ping from the client (keep-alive / debug)
      CLOSE    → remove client; simulation auto-stops when no clients remain
    """
    # ── 1. Load trip snapshot before accepting (fail fast) ──────────────────
    snapshot = _get_trip_snapshot(trip_id)

    if snapshot is None:
        # Reject with a close frame — client receives {"event":"error",...}
        await websocket.accept()
        await websocket.send_text(
            f'{{"event":"error","detail":"Trip id={trip_id} not found"}}'
        )
        await websocket.close(code=4004)
        return

    # ── 2. Accept and register ───────────────────────────────────────────────
    await manager.accept(websocket, trip_id)

    # Update snapshot with fresh client count after registering
    snapshot["clients_watching"] = manager.client_count(trip_id)

    # ── 3. Send initial snapshot to this client ──────────────────────────────
    await manager.send_personal(websocket, snapshot)

    # ── 4. Announce new client to everyone else ──────────────────────────────
    await manager.broadcast(trip_id, {
        "event":           "client_joined",
        "trip_id":         trip_id,
        "clients_watching": manager.client_count(trip_id),
        "timestamp":       _now_iso(),
    })

    # ── 5. Start location simulation if not already running ─────────────────
    _ensure_simulation_running(trip_id, snapshot)

    # ── 6. Keep the connection open, echo pings ──────────────────────────────
    try:
        while True:
            data = await websocket.receive_text()
            # Simple echo / ping-pong so clients can verify the connection
            await manager.send_personal(websocket, {
                "event":     "pong",
                "received":  data,
                "timestamp": _now_iso(),
            })
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket, trip_id)
        # Announce departure to remaining clients
        if manager.client_count(trip_id) > 0:
            await manager.broadcast(trip_id, {
                "event":           "client_left",
                "trip_id":         trip_id,
                "clients_watching": manager.client_count(trip_id),
                "timestamp":       _now_iso(),
            })
