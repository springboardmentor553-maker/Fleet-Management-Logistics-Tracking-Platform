import asyncio
import random

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app import models
from app.connection_manager import manager
from app.database import SessionLocal

router = APIRouter()

SIMULATION_INTERVAL_SECONDS = 3
# Small random step applied to lat/lng each tick, to simulate a vehicle
# actually moving rather than jumping around randomly.
STEP_DEGREES = 0.0015

# One simulation loop per trip_id, shared across all clients watching that
# trip. Started when the first client connects, stopped automatically once
# the last client for that trip disconnects.
_simulation_tasks: dict[int, asyncio.Task] = {}


async def _simulate_vehicle_location(trip_id: int) -> None:
    """Task 3: every few seconds, nudge the trip's simulated vehicle
    position and broadcast the new coordinates to everyone watching
    this trip."""
    db: Session = SessionLocal()
    try:
        trip = db.get(models.Trip, trip_id)
        if trip is None:
            return

        lat = trip.pickup_latitude if trip.pickup_latitude is not None else 0.0
        lng = trip.pickup_longitude if trip.pickup_longitude is not None else 0.0

        while manager.active_count(trip_id) > 0:
            lat += random.uniform(-STEP_DEGREES, STEP_DEGREES)
            lng += random.uniform(-STEP_DEGREES, STEP_DEGREES)

            await manager.broadcast(
                trip_id,
                {
                    "type": "vehicle_location",
                    "trip_id": trip_id,
                    "latitude": round(lat, 6),
                    "longitude": round(lng, 6),
                },
            )
            await asyncio.sleep(SIMULATION_INTERVAL_SECONDS)
    finally:
        db.close()
        _simulation_tasks.pop(trip_id, None)


@router.websocket("/ws/tracking/{trip_id}")
async def tracking_socket(websocket: WebSocket, trip_id: int):
    """Task 1: WebSocket endpoint clients connect to for live updates on
    a single trip (simulated vehicle position + shipment status)."""
    await manager.connect(trip_id, websocket)

    if trip_id not in _simulation_tasks:
        _simulation_tasks[trip_id] = asyncio.create_task(
            _simulate_vehicle_location(trip_id)
        )

    try:
        while True:
            # We don't require clients to send anything, but this keeps
            # the connection open and detects disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(trip_id, websocket)
