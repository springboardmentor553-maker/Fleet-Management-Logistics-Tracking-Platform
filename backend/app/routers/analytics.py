from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_

from app.database import get_db

from app.models.trip import Trip
from app.models.shipment import Shipment


router = APIRouter(
    prefix="/analytics",
    tags=["Operational Analytics"]
)


# ============================================================
# OPERATIONAL ANALYTICS
# ============================================================

@router.get("/operations")
def operational_analytics(
    db: Session = Depends(get_db)
):

    # ========================================================
    # TOTAL DELIVERIES
    # ========================================================
    #
    # Count trips because one trip represents one delivery execution.
    #
    total_deliveries = (
        db.query(func.count(Trip.id))
        .scalar()
        or 0
    )


    # ========================================================
    # SUCCESSFUL DELIVERIES
    # ========================================================
    #
    # Normalize with lower and trim to handle capitalization and spacing differences.
    #
    successful_deliveries = (
        db.query(func.count(Trip.id))
        .filter(
            func.lower(
                func.trim(Trip.status)
            ) == "delivered"
        )
        .scalar()
        or 0
    )


    # ========================================================
    # DELAYED DELIVERIES
    # ========================================================
    #
    # A trip is considered delayed when:
    #
    # 1. It is not cancelled
    # 2. It is not delivered
    # 3. Current time is past expected arrival
    #
    # We use Trip.expected_arrival.
    #
    from datetime import datetime

    now = datetime.now()

    delayed_deliveries = (
        db.query(func.count(Trip.id))
        .filter(
            func.lower(
                func.trim(Trip.status)
            ).notin_(
                [
                    "delivered",
                    "cancelled"
                ]
            ),
            Trip.expected_arrival.isnot(None),
            Trip.expected_arrival < now
        )
        .scalar()
        or 0
    )


    # ========================================================
    # CANCELLED DELIVERIES
    # ========================================================
    #
    cancelled_deliveries = (
        db.query(func.count(Trip.id))
        .filter(
            func.lower(
                func.trim(Trip.status)
            ) == "cancelled"
        )
        .scalar()
        or 0
    )



    # ========================================================
    # AVERAGE TRIP DISTANCE
    # ========================================================
    #
    # IMPORTANT:
    # Trip does NOT have a distance column.
    #
    # Therefore we cannot use:
    #
    # func.avg(Trip.distance)
    #
    # Instead, distance is calculated from the coordinates.
    #
    # PostgreSQL earth distance is not assumed here.
    # We calculate Haversine distance in Python.
    # ========================================================

    trips = (
        db.query(
            Trip.current_latitude,
            Trip.current_longitude,
            Trip.destination_latitude,
            Trip.destination_longitude,
            Trip.start_location,
            Trip.end_location
        )
        .all()
    )


    # --------------------------------------------------------
    # Haversine helper
    # --------------------------------------------------------

    import math


    def haversine_distance(
        lat1,
        lon1,
        lat2,
        lon2
    ):

        try:

            lat1 = float(lat1)
            lon1 = float(lon1)

            lat2 = float(lat2)
            lon2 = float(lon2)

        except (
            TypeError,
            ValueError
        ):

            return None


        earth_radius = 6371.0

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)

        delta_lat = math.radians(
            lat2 - lat1
        )

        delta_lon = math.radians(
            lon2 - lon1
        )

        a = (
            math.sin(
                delta_lat / 2
            ) ** 2
            +
            math.cos(lat1_rad)
            *
            math.cos(lat2_rad)
            *
            math.sin(
                delta_lon / 2
            ) ** 2
        )

        c = (
            2
            *
            math.atan2(
                math.sqrt(a),
                math.sqrt(1 - a)
            )
        )

        return (
            earth_radius * c
        )


    distances = []


    for trip in trips:

        # ----------------------------------------------------
        # Prefer original start coordinates if available
        # ----------------------------------------------------

        # Your Trip model stores current and destination
        # coordinates.
        #
        # For an operational distance we need the actual
        # start-to-destination distance.
        #
        # Because the current location may change while
        # tracking, do NOT use current_latitude as the
        # starting point.
        #
        # Therefore we geocode start_location here.
        # ----------------------------------------------------

        try:

            from app.services.geocoding_service import (
                get_coordinates
            )

            start_coordinates = get_coordinates(
                trip.start_location
            )

            if not start_coordinates:
                continue

            start_lat = float(
                start_coordinates["latitude"]
            )

            start_lon = float(
                start_coordinates["longitude"]
            )

            destination_lat = float(
                trip.destination_latitude
            )

            destination_lon = float(
                trip.destination_longitude
            )

            distance = haversine_distance(
                start_lat,
                start_lon,
                destination_lat,
                destination_lon
            )

            if distance is not None:

                distances.append(
                    distance
                )

        except (
            TypeError,
            ValueError,
            KeyError,
            Exception
        ):

            continue


    if distances:

        average_trip_distance = (
            sum(distances)
            /
            len(distances)
        )

    else:

        average_trip_distance = 0.0


    # ========================================================
    # AVERAGE PLANNED DELIVERY TIME
    # ========================================================
    #
    # Your UI calls this:
    #
    # Average Planned Delivery Time
    #
    # This is calculated from:
    #
    # expected_arrival - departure_time
    #
    # ========================================================

    trip_times = (
        db.query(
            Trip.departure_time,
            Trip.expected_arrival
        )
        .filter(
            Trip.departure_time.isnot(None),
            Trip.expected_arrival.isnot(None)
        )
        .all()
    )


    delivery_durations = []


    for trip in trip_times:

        try:

            duration = (
                trip.expected_arrival
                -
                trip.departure_time
            )

            hours = (
                duration.total_seconds()
                /
                3600
            )

            if hours >= 0:

                delivery_durations.append(
                    hours
                )

        except Exception:

            continue


    if delivery_durations:

        average_delivery_time_hours = (
            sum(delivery_durations)
            /
            len(delivery_durations)
        )

    else:

        average_delivery_time_hours = 0.0


    # ========================================================
    # SUCCESS RATE
    # ========================================================

    if total_deliveries > 0:

        success_rate = (
            successful_deliveries
            /
            total_deliveries
        ) * 100

    else:

        success_rate = 0.0


    # ========================================================
    # DELAY RATE
    # ========================================================

    if total_deliveries > 0:

        delay_rate = (
            delayed_deliveries
            /
            total_deliveries
        ) * 100

    else:

        delay_rate = 0.0


    # ========================================================
    # CANCELLATION RATE
    # ========================================================

    if total_deliveries > 0:

        cancellation_rate = (
            cancelled_deliveries
            /
            total_deliveries
        ) * 100

    else:

        cancellation_rate = 0.0


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "total_deliveries":
            int(total_deliveries),

        "successful_deliveries":
            int(successful_deliveries),

        "delayed_deliveries":
            int(delayed_deliveries),

        "cancelled_deliveries":
            int(cancelled_deliveries),

        "average_trip_distance":
            round(
                average_trip_distance,
                2
            ),

        "average_delivery_time_hours":
            round(
                average_delivery_time_hours,
                2
            ),

        "success_rate":
            round(
                success_rate,
                2
            ),

        "delay_rate":
            round(
                delay_rate,
                2
            ),

        "cancellation_rate":
            round(
                cancellation_rate,
                2
            )
    }