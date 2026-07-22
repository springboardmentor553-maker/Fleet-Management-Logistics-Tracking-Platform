"""
WebSocket Router — app/websocket/router.py

Exposes the single WebSocket endpoint:

    ws://host/ws/tracking/{trip_id}?token=<jwt>

Authentication
--------------
The JWT token is passed as a query parameter because browsers cannot set
custom HTTP headers (e.g. Authorization: Bearer) during the WebSocket
handshake.  The token is validated using the same SECRET_KEY and ALGORITHM
as the existing HTTP auth in app/utils/security.py — no duplication.

Connection lifecycle
--------------------
1. Validate JWT → close(4001) if invalid.
2. Verify trip exists → close(4004) if not found.
3. Accept connection via ConnectionManager.
4. Start simulation Task if not already running for this trip.
5. Keep connection alive by receiving frames; detect client disconnect.
6. On disconnect (expected or unexpected): call manager.disconnect().
"""
import asyncio
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.trip import Trip
from app.models.user import User
from app.utils.security import SECRET_KEY, ALGORITHM
from app.websocket.connection_manager import manager
from app.websocket.simulation import simulate_trip_movement

logger = logging.getLogger("fleetflow.websocket.router")

router = APIRouter(tags=["WebSocket Tracking"])


def _get_user_from_token(token: str, db: Session) -> User | None:
    """
    Decode the JWT and return the matching User, or None on failure.

    Reuses the same SECRET_KEY / ALGORITHM constants from security.py.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            return None
        user = db.query(User).filter(User.email == email).first()
        return user
    except JWTError:
        return None


@router.websocket("/ws/tracking/{trip_id}")
async def websocket_tracking(
    trip_id: int,
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
) -> None:
    """
    WebSocket endpoint for real-time trip tracking.

    Clients connect to:
        ws://localhost:8000/ws/tracking/{trip_id}?token=<jwt>

    Messages broadcast to clients:

    Location update (every ~3 seconds, real road coordinates):
        {
            "type": "location_update",
            "trip_id": 1,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "timestamp": "2026-07-22T15:30:00+00:00"
        }

    Status update (on shipment status change via PUT /shipments/{id}):
        {
            "type": "status_update",
            "trip_id": 1,
            "tracking_number": "FLT100003",
            "status": "In Transit",
            "updated_at": "2026-07-22T15:30:00+00:00"
        }
    """
    db = SessionLocal()
    try:
        # ------------------------------------------------------------------
        # 1. Authenticate — validate JWT and look up user
        # ------------------------------------------------------------------
        user = _get_user_from_token(token, db)
        if user is None:
            logger.warning(
                "ws.auth — trip=%d  rejected: invalid or expired token", trip_id
            )
            await websocket.close(code=4001, reason="Unauthorized: invalid token")
            return

        # ------------------------------------------------------------------
        # 2. Verify the trip exists
        # ------------------------------------------------------------------
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            logger.warning(
                "ws.auth — user=%s  trip=%d  rejected: trip not found",
                user.email,
                trip_id,
            )
            await websocket.close(code=4004, reason="Trip not found")
            return

        logger.info(
            "ws.connect — user=%s  trip=%d  accepted",
            user.email,
            trip_id,
        )

    finally:
        # Close the auth DB session — simulation opens its own session
        db.close()

    # ------------------------------------------------------------------
    # 3. Accept connection and register with the manager
    # ------------------------------------------------------------------
    await manager.connect(trip_id, websocket)

    # ------------------------------------------------------------------
    # 4. Start simulation if not already running for this trip
    # ------------------------------------------------------------------
    if not manager.has_running_simulation(trip_id):
        task = asyncio.create_task(
            simulate_trip_movement(trip_id, manager),
            name=f"sim-trip-{trip_id}",
        )
        manager.register_simulation(trip_id, task)
        logger.info("ws.simulation — trip=%d  task started", trip_id)

    # ------------------------------------------------------------------
    # 5. Keep-alive receive loop — detect client disconnect
    # ------------------------------------------------------------------
    try:
        while True:
            # We don't process incoming client messages for tracking,
            # but we must await receive to detect disconnection events.
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(
            "ws.disconnect — trip=%d  client disconnected (WebSocketDisconnect)",
            trip_id,
        )
    except Exception:
        logger.exception(
            "ws.error — trip=%d  unexpected error in receive loop", trip_id
        )
    finally:
        # ------------------------------------------------------------------
        # 6. Always clean up — even on unexpected errors
        # ------------------------------------------------------------------
        await manager.disconnect(trip_id, websocket)
