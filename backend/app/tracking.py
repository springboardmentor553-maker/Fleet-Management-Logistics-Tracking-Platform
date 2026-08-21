import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.trip import Trip
from app.models.driver import Driver
from app.security import verify_access_token


router = APIRouter()


# ============================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================

class ConnectionManager:

    def __init__(self):
        self.connections = {}

    async def connect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        self.connections.setdefault(
            trip_id,
            set()
        ).add(websocket)

    def disconnect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):
        connections = self.connections.get(
            trip_id
        )

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.connections.pop(
                trip_id,
                None
            )

    async def broadcast(
        self,
        trip_id: int,
        message: dict
    ):
        dead_connections = []

        for websocket in self.connections.get(
            trip_id,
            set()
        ):

            try:
                await websocket.send_json(
                    message
                )

            except Exception:
                dead_connections.append(
                    websocket
                )

        for websocket in dead_connections:
            self.disconnect(
                trip_id,
                websocket
            )


manager = ConnectionManager()


# ============================================================
# LATEST GPS LOCATIONS
# ============================================================

latest_locations = {}


# ============================================================
# HELPERS
# ============================================================

def get_user_from_token(
    token: str,
    db: Session
):

    email = verify_access_token(
        token
    )

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if user is None:
        return None

    return user


def normalize_text(value):

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


def get_driver_for_user(
    current_user: User,
    db: Session
):

    user_name = normalize_text(
        current_user.name
    )

    drivers = (
        db.query(Driver)
        .all()
    )

    for driver in drivers:

        if normalize_text(
            driver.name
        ) == user_name:

            return driver

    return None


def is_trip_access_allowed(
    current_user: User,
    trip: Trip,
    db: Session
):

    role = str(
        current_user.role
    ).lower()

    # Admin / Fleet Manager / Dispatcher
    # can monitor trips.
    if role in {
        "admin",
        "fleet manager",
        "dispatcher",
    }:

        return True

    # Driver can only access
    # their own trip.
    if role != "driver":
        return False

    driver = get_driver_for_user(
        current_user,
        db
    )

    if driver is None:
        return False

    return (
        driver.id ==
        trip.driver_id
    )


# ============================================================
# REAL-TIME TRIP TRACKING
# ============================================================

@router.websocket(
    "/ws/tracking/{trip_id}"
)
async def trip_tracking(
    websocket: WebSocket,
    trip_id: int
):

    token = (
        websocket
        .query_params
        .get("token")
    )

    if not token:

        await websocket.close(
            code=1008
        )

        return

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # AUTHENTICATE USER
        # ----------------------------------------------------

        try:

            current_user = (
                get_user_from_token(
                    token,
                    db
                )
            )

        except Exception:

            current_user = None


        if current_user is None:

            await websocket.close(
                code=1008
            )

            return


        # ----------------------------------------------------
        # FIND TRIP
        # ----------------------------------------------------

        trip = (
            db.query(Trip)
            .filter(
                Trip.id == trip_id
            )
            .first()
        )


        if trip is None:

            await websocket.close(
                code=1008
            )

            return


        # ----------------------------------------------------
        # CHECK PERMISSION
        # ----------------------------------------------------

        if not is_trip_access_allowed(
            current_user,
            trip,
            db
        ):

            await websocket.close(
                code=1008
            )

            return


        # ----------------------------------------------------
        # CONNECT
        # ----------------------------------------------------

        await manager.connect(
            trip_id,
            websocket
        )


        # ----------------------------------------------------
        # SEND LAST KNOWN LOCATION
        # ----------------------------------------------------

        latest = (
            latest_locations
            .get(trip_id)
        )


        if latest:

            await websocket.send_json({
                "type": "location",
                **latest
            })

        else:

            await websocket.send_json({
                "type": "status",
                "status": "connected",
                "message": (
                    "Real-time tracking "
                    "connected."
                )
            })


        # ----------------------------------------------------
        # RECEIVE MESSAGES
        # ----------------------------------------------------

        while True:

            message = (
                await websocket
                .receive_text()
            )


            try:

                payload = json.loads(
                    message
                )

            except json.JSONDecodeError:

                continue


            message_type = (
                payload.get("type")
            )


            # ------------------------------------------------
            # PING
            # ------------------------------------------------

            if message_type == "ping":

                await websocket.send_json({
                    "type": "pong"
                })

                continue


            # ------------------------------------------------
            # LOCATION UPDATE
            # ------------------------------------------------

            if message_type != "location":
                continue


            # Only drivers may publish
            # GPS positions.
            if (
                str(
                    current_user.role
                ).lower()
                != "driver"
            ):

                continue


            driver = (
                get_driver_for_user(
                    current_user,
                    db
                )
            )


            if (
                driver is None
                or driver.id != trip.driver_id
            ):

                continue


            # ------------------------------------------------
            # VALIDATE COORDINATES
            # ------------------------------------------------

            try:

                latitude = float(
                    payload.get(
                        "latitude"
                    )
                )

                longitude = float(
                    payload.get(
                        "longitude"
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                continue


            if not (
                -90 <= latitude <= 90
                and
                -180 <= longitude <= 180
            ):

                continue


            # ------------------------------------------------
            # SAVE LATEST LOCATION
            # ------------------------------------------------

            location = {

                "latitude":
                    latitude,

                "longitude":
                    longitude,

                "timestamp":
                    datetime.now(
                        timezone.utc
                    ).isoformat()
            }


            latest_locations[
                trip_id
            ] = location


            # ------------------------------------------------
            # BROADCAST TO ALL VIEWERS
            # ------------------------------------------------

            await manager.broadcast(
                trip_id,
                {
                    "type": "location",
                    **location
                }
            )


    except WebSocketDisconnect:

        pass


    except Exception as exc:

        print(
            "Tracking WebSocket error:",
            exc
        )


    finally:

        manager.disconnect(
            trip_id,
            websocket
        )

        db.close()