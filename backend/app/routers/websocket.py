import asyncio
from datetime import datetime, timezone

import requests

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models


router = APIRouter()


# =========================================================
# HELPERS
# =========================================================

def to_utc(value):
    """
    Convert a datetime value to UTC-aware datetime.
    """

    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        timezone.utc
    )


def normalize_status(status):
    """
    Normalize trip status into lowercase text.
    """

    if status is None:
        return ""

    if hasattr(status, "value"):
        status = status.value

    return str(status).strip().lower()


# =========================================================
# CALCULATE TRIP PROGRESS
# =========================================================

def calculate_time_progress(trip):
    """
    Calculate current trip progress using:

        scheduled_start_time
                 ↓
            current time
                 ↓
        scheduled_end_time

    The browser is NOT responsible for progress.

    This means the trip continues even when the
    Tracking page is closed.
    """

    start_time = to_utc(
        trip.scheduled_start_time
    )

    end_time = to_utc(
        trip.scheduled_end_time
    )

    if not start_time or not end_time:
        return 0.0

    now = datetime.now(
        timezone.utc
    )

    total_seconds = (
        end_time - start_time
    ).total_seconds()

    if total_seconds <= 0:
        return 100.0

    elapsed_seconds = (
        now - start_time
    ).total_seconds()

    progress = (
        elapsed_seconds
        / total_seconds
    ) * 100

    return max(
        0.0,
        min(
            100.0,
            progress
        )
    )


# =========================================================
# GET SMOOTH ROUTE POSITION
# =========================================================

def get_route_point(
    route_points,
    progress,
):
    """
    Convert progress percentage into a smooth
    position along the road route.

    Instead of simply selecting one integer
    route point, interpolate between two
    neighbouring points.

    This makes latitude and longitude change
    smoothly.
    """

    if not route_points:

        return (
            0.0,
            None
        )

    if len(route_points) == 1:

        return (
            0.0,
            route_points[0]
        )

    # -----------------------------------------------------
    # Convert percentage into exact route position
    # -----------------------------------------------------

    exact_position = (
        progress / 100.0
    ) * (
        len(route_points) - 1
    )

    # -----------------------------------------------------
    # Find neighbouring route points
    # -----------------------------------------------------

    lower_index = int(
        exact_position
    )

    upper_index = min(
        lower_index + 1,
        len(route_points) - 1
    )

    # -----------------------------------------------------
    # Fraction between points
    # -----------------------------------------------------

    fraction = (
        exact_position
        - lower_index
    )

    lower_point = route_points[
        lower_index
    ]

    upper_point = route_points[
        upper_index
    ]

    # -----------------------------------------------------
    # Interpolate latitude
    # -----------------------------------------------------

    latitude = (
        lower_point[0]
        +
        (
            upper_point[0]
            -
            lower_point[0]
        )
        * fraction
    )

    # -----------------------------------------------------
    # Interpolate longitude
    # -----------------------------------------------------

    longitude = (
        lower_point[1]
        +
        (
            upper_point[1]
            -
            lower_point[1]
        )
        * fraction
    )

    return (
        exact_position,
        [
            latitude,
            longitude,
        ]
    )


# =========================================================
# LOAD REAL ROAD ROUTE FROM OSRM
# =========================================================

def load_osrm_route(
    start_lat,
    start_lon,
    end_lat,
    end_lon,
):
    """
    Get the real driving route from OSRM.
    """

    osrm_url = (
        "https://router.project-osrm.org/"
        "route/v1/driving/"
        f"{start_lon},{start_lat};"
        f"{end_lon},{end_lat}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    response = requests.get(
        osrm_url,
        params=params,
        timeout=15,
    )

    response.raise_for_status()

    data = response.json()

    if (
        data.get("code") != "Ok"
        or not data.get("routes")
    ):
        raise ValueError(
            "Unable to calculate road route"
        )

    geometry = (
        data["routes"][0]["geometry"]
    )

    coordinates = (
        geometry["coordinates"]
    )

    # OSRM format:
    #
    # [longitude, latitude]
    #
    # Frontend format:
    #
    # [latitude, longitude]

    route_points = [
        [
            float(point[1]),
            float(point[0]),
        ]
        for point in coordinates
    ]

    if len(route_points) < 2:

        raise ValueError(
            "Invalid road route"
        )

    return route_points


# =========================================================
# LIVE TRIP TRACKING WEBSOCKET
# =========================================================

@router.websocket(
    "/ws/tracking/{trip_id}"
)
async def tracking_websocket(
    websocket: WebSocket,
    trip_id: int,
):
    """
    Live trip tracking endpoint.

    Important:

    The WebSocket only DISPLAYs the current
    backend state.

    It does NOT control the trip lifecycle.

    Therefore:

        Closing browser
               ↓
        WebSocket disconnects
               ↓
        Trip continues in backend
               ↓
        Reopen Tracking
               ↓
        Current progress is shown
    """

    await websocket.accept()

    db: Session = SessionLocal()

    try:

        # =================================================
        # FIND TRIP
        # =================================================

        trip = (
            db.query(models.Trip)
            .filter(
                models.Trip.id == trip_id
            )
            .first()
        )

        if not trip:

            await websocket.send_json({
                "error": "Trip not found"
            })

            await websocket.close(
                code=1008
            )

            return

        # =================================================
        # FIND ROUTE
        # =================================================

        route = (
            db.query(models.Route)
            .filter(
                models.Route.trip_id
                == trip_id
            )
            .first()
        )

        if not route:

            await websocket.send_json({
                "error": "Route not found"
            })

            await websocket.close(
                code=1008
            )

            return

        # =================================================
        # GET ROUTE COORDINATES
        # =================================================

        try:

            start_lat = float(
                route.source_latitude
            )

            start_lon = float(
                route.source_longitude
            )

            end_lat = float(
                route.destination_latitude
            )

            end_lon = float(
                route.destination_longitude
            )

        except (
            TypeError,
            ValueError,
        ):

            await websocket.send_json({
                "error": (
                    "Invalid route coordinates"
                )
            })

            await websocket.close(
                code=1008
            )

            return

        # =================================================
        # GET REAL ROAD ROUTE
        # =================================================

        try:

            route_points = (
                await asyncio.to_thread(
                    load_osrm_route,
                    start_lat,
                    start_lon,
                    end_lat,
                    end_lon,
                )
            )

        except Exception as error:

            print(
                f"[TRACKING] "
                f"OSRM error for Trip "
                f"{trip_id}: {error}"
            )

            await websocket.send_json({
                "error": (
                    "Routing service unavailable"
                )
            })

            await websocket.close(
                code=1011
            )

            return

        total_points = len(
            route_points
        )

        # =================================================
        # CONTINUOUS TRACKING LOOP
        # =================================================

        while True:

            # -------------------------------------------------
            # Refresh database state
            # -------------------------------------------------

            db.expire_all()

            trip = (
                db.query(models.Trip)
                .filter(
                    models.Trip.id
                    == trip_id
                )
                .first()
            )

            if not trip:
                break

            # -------------------------------------------------
            # Current database status
            # -------------------------------------------------

            database_status = (
                normalize_status(
                    trip.trip_status
                )
            )

            # =================================================
            # COMPLETED
            # =================================================

            if database_status in {
                "completed",
                "complete",
            }:

                progress = 100.0

                current_index = (
                    float(
                        total_points - 1
                    )
                )

                point = route_points[
                    total_points - 1
                ]

                await websocket.send_json({

                    "trip_id":
                        trip_id,

                    "latitude":
                        round(
                            point[0],
                            6,
                        ),

                    "longitude":
                        round(
                            point[1],
                            6,
                        ),

                    "status":
                        "Completed",

                    "progress":
                        100.0,

                    "current_index":
                        round(
                            current_index,
                            2,
                        ),

                    "total_points":
                        total_points,

                    "gps_online":
                        False,

                    "tracking_active":
                        False,

                })

                print(
                    f"[TRACKING] "
                    f"Trip {trip_id} "
                    f"is completed."
                )

                break

            # =================================================
            # CANCELLED
            # =================================================

            if database_status in {
                "cancelled",
                "canceled",
            }:

                progress = (
                    calculate_time_progress(
                        trip
                    )
                )

                current_index, point = (
                    get_route_point(
                        route_points,
                        progress,
                    )
                )

                await websocket.send_json({

                    "trip_id":
                        trip_id,

                    "latitude":
                        round(
                            point[0],
                            6,
                        ),

                    "longitude":
                        round(
                            point[1],
                            6,
                        ),

                    "status":
                        "Cancelled",

                    "progress":
                        round(
                            progress,
                            3,
                        ),

                    "current_index":
                        round(
                            current_index,
                            2,
                        ),

                    "total_points":
                        total_points,

                    "gps_online":
                        False,

                    "tracking_active":
                        False,

                })

                break

            # =================================================
            # CALCULATE TIME PROGRESS
            # =================================================

            progress = (
                calculate_time_progress(
                    trip
                )
            )

            # =================================================
            # CHECK START TIME
            # =================================================

            start_time = to_utc(
                trip.scheduled_start_time
            )

            now = datetime.now(
                timezone.utc
            )

            if (
                start_time
                and now < start_time
            ):

                progress = 0.0

                status_text = (
                    "Scheduled"
                )

            else:

                # =================================================
                # ACTIVE / COMPLETED BY TIME
                # =================================================

                if progress >= 100.0:

                    progress = 100.0

                    status_text = (
                        "Completed"
                    )

                else:

                    status_text = (
                        "In Transit"
                    )

            # =================================================
            # GET SMOOTH VEHICLE POSITION
            # =================================================

            current_index, point = (
                get_route_point(
                    route_points,
                    progress,
                )
            )

            if point is None:

                await websocket.send_json({
                    "error":
                        "Vehicle position unavailable"
                })

                break

            latitude = point[0]

            longitude = point[1]

            # =================================================
            # GPS STATUS
            # =================================================

            gps_online = (
                status_text
                not in {
                    "Completed",
                    "Cancelled",
                }
            )

            # =================================================
            # TRACKING STATUS
            # =================================================

            tracking_active = (
                status_text
                == "In Transit"
            )

            # =================================================
            # SEND LIVE DATA
            # =================================================

            await websocket.send_json({

                "trip_id":
                    trip_id,

                "latitude":
                    round(
                        latitude,
                        6,
                    ),

                "longitude":
                    round(
                        longitude,
                        6,
                    ),

                "status":
                    status_text,

                "progress":
                    round(
                        progress,
                        3,
                    ),

                "current_index":
                    round(
                        current_index,
                        2,
                    ),

                "total_points":
                    total_points,

                "gps_online":
                    gps_online,

                "tracking_active":
                    tracking_active,

            })

            # =================================================
            # AUTOMATIC COMPLETION
            # =================================================

            if (
                progress >= 100.0
                and status_text
                == "Completed"
            ):

                trip.trip_status = (
                    "Completed"
                )

                db.commit()

                print(
                    f"[TRACKING] "
                    f"Trip {trip_id} "
                    f"completed automatically."
                )

                # Send final completed state
                await websocket.send_json({

                    "trip_id":
                        trip_id,

                    "latitude":
                        round(
                            end_lat,
                            6,
                        ),

                    "longitude":
                        round(
                            end_lon,
                            6,
                        ),

                    "status":
                        "Completed",

                    "progress":
                        100.0,

                    "current_index":
                        total_points - 1,

                    "total_points":
                        total_points,

                    "gps_online":
                        False,

                    "tracking_active":
                        False,

                })

                break

            # =================================================
            # UPDATE EVERY SECOND
            # =================================================

            await asyncio.sleep(1)

    # =====================================================
    # BROWSER DISCONNECTED
    # =====================================================

    except WebSocketDisconnect:

        print(
            f"[TRACKING] "
            f"Viewer disconnected "
            f"from Trip {trip_id}."
        )

        # IMPORTANT:
        #
        # Do NOT reset the trip.
        #
        # Do NOT change the trip status.
        #
        # Do NOT reset progress.
        #
        # The backend trip monitor continues
        # independently.

    # =====================================================
    # OTHER ERROR
    # =====================================================

    except Exception as error:

        print(
            f"[TRACKING] "
            f"Trip {trip_id} error: "
            f"{error}"
        )

    # =====================================================
    # CLOSE DATABASE
    # =====================================================

    finally:

        db.close()