import asyncio
import math
from typing import Dict, List, Tuple

import httpx

from app.database import SessionLocal
from app.models.trip import Trip
from app.websocket.connection_manager import manager


# ==========================================================
# CONFIGURATION
# ==========================================================

OSRM_URL = (
    "https://router.project-osrm.org/route/v1/driving"
)

# Slow and smooth movement
SIMULATION_INTERVAL = 5

# Maximum route points
MAX_SIMULATION_POINTS = 100

# Vehicle speed used only for simulation timing.
# 35 km/h gives slower, easier-to-see movement.
SIMULATION_SPEED_KMH = 35.0


# ==========================================================
# IMPORTANT:
# ONLY ONE SIMULATION MAY RUN FOR ONE TRIP
# ==========================================================

_running_simulations: Dict[int, asyncio.Task] = {}

_simulation_lock = asyncio.Lock()


# ==========================================================
# HAVERSINE DISTANCE
# ==========================================================

def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )

    return earth_radius_km * c


# ==========================================================
# ROUTE DISTANCE
# ==========================================================

def calculate_route_distance(
    route_points: List[Tuple[float, float]],
) -> float:

    if len(route_points) < 2:
        return 0.0

    total_distance = 0.0

    for index in range(len(route_points) - 1):

        lat1, lon1 = route_points[index]
        lat2, lon2 = route_points[index + 1]

        total_distance += haversine_distance(
            lat1,
            lon1,
            lat2,
            lon2,
        )

    return total_distance


# ==========================================================
# DISTANCE FROM INDEX TO DESTINATION
# ==========================================================

def calculate_remaining_distance(
    route_points: List[Tuple[float, float]],
    current_index: int,
) -> float:

    if not route_points:
        return 0.0

    if current_index >= len(route_points) - 1:
        return 0.0

    remaining = 0.0

    for index in range(
        current_index,
        len(route_points) - 1,
    ):

        lat1, lon1 = route_points[index]
        lat2, lon2 = route_points[index + 1]

        remaining += haversine_distance(
            lat1,
            lon1,
            lat2,
            lon2,
        )

    return remaining


# ==========================================================
# FIND NEAREST ROUTE POINT
# ==========================================================

def find_nearest_route_index(
    route_points: List[Tuple[float, float]],
    latitude: float,
    longitude: float,
) -> int:

    if not route_points:
        return 0

    nearest_index = 0
    nearest_distance = float("inf")

    for index, (
        point_latitude,
        point_longitude,
    ) in enumerate(route_points):

        distance = haversine_distance(
            latitude,
            longitude,
            point_latitude,
            point_longitude,
        )

        if distance < nearest_distance:

            nearest_distance = distance
            nearest_index = index

    return nearest_index


# ==========================================================
# RESAMPLE ROUTE
# ==========================================================

def resample_route(
    route_points: List[Tuple[float, float]],
    maximum_points: int,
) -> List[Tuple[float, float]]:

    if len(route_points) <= maximum_points:
        return route_points

    result = []

    last_index = len(route_points) - 1

    for index in range(maximum_points):

        position = (
            index * last_index
        ) / (maximum_points - 1)

        selected_index = round(position)

        result.append(
            route_points[selected_index]
        )

    return result


# ==========================================================
# GET ROAD ROUTE
# ==========================================================

async def get_road_route(
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
):

    if (
        pickup_latitude is None
        or pickup_longitude is None
        or destination_latitude is None
        or destination_longitude is None
    ):

        raise ValueError(
            "Pickup and destination coordinates are required."
        )

    url = (
        f"{OSRM_URL}/"
        f"{pickup_longitude},{pickup_latitude};"
        f"{destination_longitude},{destination_latitude}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    try:

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.get(
                url,
                params=params,
            )

    except httpx.RequestError as exc:

        raise ValueError(
            "Unable to connect to routing service: "
            f"{exc}"
        )

    if response.status_code != 200:

        raise ValueError(
            "Routing service returned HTTP "
            f"{response.status_code}."
        )

    try:

        data = response.json()

    except ValueError:

        raise ValueError(
            "Routing service returned invalid JSON."
        )

    if data.get("code") != "Ok":

        raise ValueError(
            data.get(
                "message",
                "Unable to generate road route.",
            )
        )

    routes = data.get(
        "routes",
        [],
    )

    if not routes:

        raise ValueError(
            "No route found between pickup and destination."
        )

    route = routes[0]

    geometry = route.get(
        "geometry"
    )

    if not geometry:

        raise ValueError(
            "Route geometry was not returned."
        )

    coordinates = geometry.get(
        "coordinates",
        [],
    )

    if len(coordinates) < 2:

        raise ValueError(
            "Route does not contain enough coordinates."
        )

    route_points = []

    for coordinate in coordinates:

        if len(coordinate) < 2:
            continue

        longitude = float(
            coordinate[0]
        )

        latitude = float(
            coordinate[1]
        )

        route_points.append(
            (
                latitude,
                longitude,
            )
        )

    if len(route_points) < 2:

        raise ValueError(
            "Unable to create route points."
        )

    # Exact pickup
    route_points[0] = (
        float(pickup_latitude),
        float(pickup_longitude),
    )

    # Exact destination
    route_points[-1] = (
        float(destination_latitude),
        float(destination_longitude),
    )

    distance_meters = float(
        route.get(
            "distance",
            0,
        )
    )

    duration_seconds = float(
        route.get(
            "duration",
            0,
        )
    )

    distance_km = (
        distance_meters / 1000.0
    )

    duration_minutes = (
        duration_seconds / 60.0
    )

    route_points = resample_route(
        route_points,
        MAX_SIMULATION_POINTS,
    )

    return {
        "points": route_points,
        "distance_km": round(
            distance_km,
            2,
        ),
        "duration_minutes": round(
            duration_minutes,
            2,
        ),
    }


# ==========================================================
# BROADCAST CURRENT LOCATION
# ==========================================================

async def broadcast_location(
    trip_id: int,
    latitude: float,
    longitude: float,
    status: str,
    progress: float,
    remaining_distance_km: float,
    remaining_duration_minutes: float,
    total_distance_km: float,
    total_duration_minutes: float,
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
):

    await manager.broadcast_trip(
        trip_id,
        {
            "type": "location_update",

            "trip_id": trip_id,

            "latitude": round(
                latitude,
                6,
            ),

            "longitude": round(
                longitude,
                6,
            ),

            "status": status,

            "progress": round(
                progress,
                2,
            ),

            "remaining_distance_km": round(
                max(
                    remaining_distance_km,
                    0.0,
                ),
                2,
            ),

            "remaining_duration_minutes": round(
                max(
                    remaining_duration_minutes,
                    0.0,
                ),
                2,
            ),

            "eta_minutes": round(
                max(
                    remaining_duration_minutes,
                    0.0,
                ),
                2,
            ),

            "total_distance_km": round(
                total_distance_km,
                2,
            ),

            "total_duration_minutes": round(
                total_duration_minutes,
                2,
            ),

            "pickup_latitude": (
                pickup_latitude
            ),

            "pickup_longitude": (
                pickup_longitude
            ),

            "destination_latitude": (
                destination_latitude
            ),

            "destination_longitude": (
                destination_longitude
            ),
        },
    )


# ==========================================================
# MAIN SIMULATOR
# ==========================================================

async def simulate_vehicle_location(
    trip_id: int,
):

    # ------------------------------------------------------
    # PROTECTION AGAINST DUPLICATE SIMULATORS
    # ------------------------------------------------------

    current_task = asyncio.current_task()

    async with _simulation_lock:

        existing_task = _running_simulations.get(
            trip_id
        )

        if (
            existing_task is not None
            and not existing_task.done()
            and existing_task is not current_task
        ):

            print(
                f"Trip {trip_id}: "
                "simulation already running. "
                "New simulation ignored."
            )

            return

        _running_simulations[
            trip_id
        ] = current_task

    db = SessionLocal()

    try:

        # ==================================================
        # GET TRIP
        # ==================================================

        trip = (
            db.query(Trip)
            .filter(
                Trip.id == trip_id
            )
            .first()
        )

        if trip is None:

            print(
                f"Trip {trip_id} not found."
            )

            return

        # ==================================================
        # VALIDATE COORDINATES
        # ==================================================

        if (
            trip.pickup_latitude is None
            or trip.pickup_longitude is None
            or trip.destination_latitude is None
            or trip.destination_longitude is None
        ):

            message = (
                "Trip does not have complete "
                "pickup and destination coordinates."
            )

            print(
                f"Trip {trip_id}: {message}"
            )

            await manager.broadcast_trip(
                trip_id,
                {
                    "type": "simulation_error",
                    "trip_id": trip_id,
                    "message": message,
                },
            )

            return

        pickup_latitude = float(
            trip.pickup_latitude
        )

        pickup_longitude = float(
            trip.pickup_longitude
        )

        destination_latitude = float(
            trip.destination_latitude
        )

        destination_longitude = float(
            trip.destination_longitude
        )

        # ==================================================
        # GET ACTUAL OSRM ROAD ROUTE
        # ==================================================

        route_data = await get_road_route(
            pickup_latitude,
            pickup_longitude,
            destination_latitude,
            destination_longitude,
        )

        route_points = route_data[
            "points"
        ]

        total_route_distance_km = float(
            route_data["distance_km"]
        )

        total_route_duration_minutes = float(
            route_data["duration_minutes"]
        )

        print(
            f"Trip {trip_id}: "
            f"Road distance = "
            f"{total_route_distance_km:.2f} km"
        )

        print(
            f"Trip {trip_id}: "
            f"OSRM duration = "
            f"{total_route_duration_minutes:.2f} mins"
        )

        # ==================================================
        # IMPORTANT:
        # RESUME FROM SAVED LOCATION
        # ==================================================

        if (
            trip.current_latitude is not None
            and trip.current_longitude is not None
            and trip.progress is not None
            and float(trip.progress) > 0
            and trip.trip_status
            in (
                "In Transit",
                "In Progress",
            )
        ):

            current_latitude = float(
                trip.current_latitude
            )

            current_longitude = float(
                trip.current_longitude
            )

            start_index = (
                find_nearest_route_index(
                    route_points,
                    current_latitude,
                    current_longitude,
                )
            )

            # Never move backwards.
            saved_progress = float(
                trip.progress
            )

            calculated_progress = (
                start_index
                /
                max(
                    len(route_points) - 1,
                    1,
                )
            ) * 100.0

            if saved_progress > calculated_progress:

                # Find index based on saved progress
                start_index = min(
                    len(route_points) - 1,
                    max(
                        0,
                        round(
                            (
                                saved_progress
                                / 100.0
                            )
                            * (
                                len(route_points) - 1
                            )
                        ),
                    ),
                )

            print(
                f"Trip {trip_id}: "
                f"RESUMING from saved position "
                f"{current_latitude:.6f}, "
                f"{current_longitude:.6f}"
            )

            print(
                f"Trip {trip_id}: "
                f"Resume index = {start_index}"
            )

        else:

            # New trip starts at pickup
            start_index = 0

            current_latitude = (
                pickup_latitude
            )

            current_longitude = (
                pickup_longitude
            )

            # Save initial position
            trip.current_latitude = (
                pickup_latitude
            )

            trip.current_longitude = (
                pickup_longitude
            )

            trip.progress = 0.0

            trip.remaining_distance_km = (
                total_route_distance_km
            )

            trip.remaining_duration_minutes = (
                total_route_duration_minutes
            )

            trip.trip_status = "Scheduled"

            db.commit()

            print(
                f"Trip {trip_id}: "
                "Starting new simulation at pickup."
            )

        # ==================================================
        # CALCULATE GEOMETRY TOTAL
        # ==================================================

        geometry_total_distance_km = (
            calculate_route_distance(
                route_points
            )
        )

        # ==================================================
        # START / RESUME BROADCAST
        # ==================================================

        remaining_distance = (
            calculate_remaining_distance(
                route_points,
                start_index,
            )
        )

        if geometry_total_distance_km > 0:

            remaining_ratio = (
                remaining_distance
                /
                geometry_total_distance_km
            )

        else:

            remaining_ratio = 0.0

        remaining_distance_km = (
            total_route_distance_km
            * remaining_ratio
        )

        remaining_duration_minutes = (
            total_route_duration_minutes
            * remaining_ratio
        )

        if start_index >= len(route_points) - 1:

            remaining_distance_km = 0.0
            remaining_duration_minutes = 0.0
            progress = 100.0

        else:

            progress = (
                start_index
                /
                max(
                    len(route_points) - 1,
                    1,
                )
            ) * 100.0

        await broadcast_location(
            trip_id=trip_id,
            latitude=current_latitude,
            longitude=current_longitude,
            status=(
                "In Transit"
                if start_index > 0
                else "At Pickup"
            ),
            progress=progress,
            remaining_distance_km=(
                remaining_distance_km
            ),
            remaining_duration_minutes=(
                remaining_duration_minutes
            ),
            total_distance_km=(
                total_route_distance_km
            ),
            total_duration_minutes=(
                total_route_duration_minutes
            ),
            pickup_latitude=(
                pickup_latitude
            ),
            pickup_longitude=(
                pickup_longitude
            ),
            destination_latitude=(
                destination_latitude
            ),
            destination_longitude=(
                destination_longitude
            ),
        )

        # ==================================================
        # SIMULATION LOOP
        # ==================================================

        for index in range(
            start_index,
            len(route_points),
        ):

            latitude, longitude = (
                route_points[index]
            )

            # ----------------------------------------------
            # PROGRESS
            # ----------------------------------------------

            if len(route_points) <= 1:

                progress = 100.0

            else:

                progress = (
                    index
                    /
                    (
                        len(route_points) - 1
                    )
                ) * 100.0

            # ----------------------------------------------
            # REMAINING DISTANCE
            # ----------------------------------------------

            remaining_geometry_distance_km = (
                calculate_remaining_distance(
                    route_points,
                    index,
                )
            )

            if (
                geometry_total_distance_km > 0
                and total_route_distance_km > 0
            ):

                distance_ratio = (
                    remaining_geometry_distance_km
                    /
                    geometry_total_distance_km
                )

                remaining_distance_km = (
                    total_route_distance_km
                    * distance_ratio
                )

            else:

                remaining_distance_km = 0.0

            # ----------------------------------------------
            # ETA
            # ----------------------------------------------

            if (
                total_route_distance_km > 0
                and total_route_duration_minutes > 0
            ):

                duration_ratio = (
                    remaining_distance_km
                    /
                    total_route_distance_km
                )

                remaining_duration_minutes = (
                    total_route_duration_minutes
                    * duration_ratio
                )

            else:

                remaining_duration_minutes = 0.0

            # ----------------------------------------------
            # NEVER ALLOW NEGATIVE VALUES
            # ----------------------------------------------

            remaining_distance_km = max(
                0.0,
                remaining_distance_km,
            )

            remaining_duration_minutes = max(
                0.0,
                remaining_duration_minutes,
            )

            # ----------------------------------------------
            # DESTINATION
            # ----------------------------------------------

            if index == len(route_points) - 1:

                latitude = (
                    destination_latitude
                )

                longitude = (
                    destination_longitude
                )

                progress = 100.0

                remaining_distance_km = 0.0

                remaining_duration_minutes = 0.0

                status = (
                    "Arrived at Destination"
                )

            elif index == 0:

                status = "At Pickup"

            else:

                status = "In Transit"

            # ==================================================
            # SAVE CURRENT LOCATION
            # ==================================================

            trip.current_latitude = (
                float(latitude)
            )

            trip.current_longitude = (
                float(longitude)
            )

            trip.progress = float(
                progress
            )

            trip.remaining_distance_km = (
                float(
                    remaining_distance_km
                )
            )

            trip.remaining_duration_minutes = (
                float(
                    remaining_duration_minutes
                )
            )

            if status == "Arrived at Destination":

                trip.trip_status = (
                    "Completed"
                )

            elif status == "At Pickup":

                trip.trip_status = (
                    "Scheduled"
                )

            else:

                trip.trip_status = (
                    "In Transit"
                )

            db.commit()

            # ==================================================
            # SEND LIVE UPDATE
            # ==================================================

            await broadcast_location(
                trip_id=trip_id,
                latitude=latitude,
                longitude=longitude,
                status=status,
                progress=progress,
                remaining_distance_km=(
                    remaining_distance_km
                ),
                remaining_duration_minutes=(
                    remaining_duration_minutes
                ),
                total_distance_km=(
                    total_route_distance_km
                ),
                total_duration_minutes=(
                    total_route_duration_minutes
                ),
                pickup_latitude=(
                    pickup_latitude
                ),
                pickup_longitude=(
                    pickup_longitude
                ),
                destination_latitude=(
                    destination_latitude
                ),
                destination_longitude=(
                    destination_longitude
                ),
            )

            print(
                f"Trip {trip_id} -> "
                f"{latitude:.6f}, "
                f"{longitude:.6f} | "
                f"{status} | "
                f"{progress:.1f}% | "
                f"Remaining: "
                f"{remaining_distance_km:.2f} km | "
                f"ETA: "
                f"{remaining_duration_minutes:.2f} mins"
            )

            # ==================================================
            # FINISHED
            # ==================================================

            if (
                index
                ==
                len(route_points) - 1
            ):

                await manager.broadcast_trip(
                    trip_id,
                    {
                        "type": "trip_completed",

                        "trip_id": trip_id,

                        "latitude": (
                            destination_latitude
                        ),

                        "longitude": (
                            destination_longitude
                        ),

                        "status": "Completed",

                        "progress": 100,

                        "remaining_distance_km": 0,

                        "remaining_duration_minutes": 0,

                        "eta_minutes": 0,

                        "total_distance_km": round(
                            total_route_distance_km,
                            2,
                        ),

                        "total_duration_minutes": round(
                            total_route_duration_minutes,
                            2,
                        ),
                    },
                )

                print(
                    f"Trip {trip_id} "
                    "arrived at destination."
                )

                break

            # ==================================================
            # SLOW MOVEMENT
            # ==================================================

            await asyncio.sleep(
                SIMULATION_INTERVAL
            )

    except asyncio.CancelledError:

        print(
            f"Trip {trip_id} "
            "simulation cancelled."
        )

        raise

    except Exception as exc:

        db.rollback()

        print(
            f"Trip {trip_id} "
            f"simulation error: {exc}"
        )

        try:

            await manager.broadcast_trip(
                trip_id,
                {
                    "type": "simulation_error",

                    "trip_id": trip_id,

                    "message": str(exc),
                },
            )

        except Exception:

            pass

    finally:

        db.close()

        # --------------------------------------------------
        # Remove task from registry
        # --------------------------------------------------

        async with _simulation_lock:

            existing_task = (
                _running_simulations.get(
                    trip_id
                )
            )

            if existing_task is current_task:

                _running_simulations.pop(
                    trip_id,
                    None,
                )


# ==========================================================
# SAFE START FUNCTION
# ==========================================================

async def start_vehicle_simulation(
    trip_id: int,
):

    """
    Start exactly one simulation for a trip.

    If the trip is already running, the existing
    simulation is kept alive.
    """

    async with _simulation_lock:

        existing_task = (
            _running_simulations.get(
                trip_id
            )
        )

        if (
            existing_task is not None
            and not existing_task.done()
        ):

            print(
                f"Trip {trip_id}: "
                "simulation already running."
            )

            return existing_task

        task = asyncio.create_task(
            simulate_vehicle_location(
                trip_id
            )
        )

        _running_simulations[
            trip_id
        ] = task

        print(
            f"Trip {trip_id}: "
            "new simulation started."
        )

        return task


# ==========================================================
# STOP SIMULATION
# ==========================================================

async def stop_vehicle_simulation(
    trip_id: int,
):

    async with _simulation_lock:

        task = _running_simulations.get(
            trip_id
        )

        if (
            task is None
            or task.done()
        ):

            _running_simulations.pop(
                trip_id,
                None,
            )

            return

        print(
            f"Trip {trip_id}: "
            "stopping simulation."
        )

        task.cancel()

    try:

        await task

    except asyncio.CancelledError:

        pass