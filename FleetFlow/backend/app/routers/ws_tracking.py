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
import math
import random
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
LOCATION_JITTER   = 0.002   # max random offset in degrees per tick (~200 m)
# ────────────────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
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


def _simulate_next_position(
    current_lat: float,
    current_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> tuple[float, float]:
    """
    Move the vehicle a tiny step toward the destination, plus small random
    jitter — mimics a real GPS feed updating every few seconds.

    Uses a simple linear interpolation with a constant step size so the
    vehicle reaches the destination in a reasonable demo time (~2 minutes).
    """
    STEP_FRACTION = 0.03          # advance 3 % of remaining distance each tick

    dlat = dest_lat - current_lat
    dlng = dest_lng - current_lng
    remaining = math.sqrt(dlat**2 + dlng**2)

    if remaining < 0.001:         # close enough → don't overshoot
        return dest_lat, dest_lng

    new_lat = current_lat + dlat * STEP_FRACTION + random.uniform(-LOCATION_JITTER, LOCATION_JITTER)
    new_lng = current_lng + dlng * STEP_FRACTION + random.uniform(-LOCATION_JITTER, LOCATION_JITTER)
    return round(new_lat, 6), round(new_lng, 6)


# ─────────────────────────────────────────────────────────────────────────────
# Background task — live location simulation (Task 3)
# ─────────────────────────────────────────────────────────────────────────────

async def _simulate_location(trip_id: int, snapshot: dict) -> None:
    """
    Runs as a separate asyncio task for each unique trip_id.
    Stops automatically when no more clients are watching.
    """
    lat  = snapshot.get("lat")  or 0.0
    lng  = snapshot.get("lng")  or 0.0
    dlat = snapshot.get("destination_lat") or lat
    dlng = snapshot.get("destination_lng") or lng

    logger.info("Location simulation started for trip_id=%s", trip_id)

    while manager.client_count(trip_id) > 0:
        await asyncio.sleep(LOCATION_INTERVAL)

        # No point broadcasting to zero clients
        if manager.client_count(trip_id) == 0:
            break

        lat, lng = _simulate_next_position(lat, lng, dlat, dlng)

        payload = {
            "event":     "location_update",
            "trip_id":   trip_id,
            "lat":       lat,
            "lng":       lng,
            "timestamp": _now_iso(),
        }
        await manager.broadcast(trip_id, payload)
        logger.debug("Location broadcast trip_id=%s  lat=%s lng=%s", trip_id, lat, lng)

    logger.info("Location simulation stopped for trip_id=%s (no clients)", trip_id)


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
