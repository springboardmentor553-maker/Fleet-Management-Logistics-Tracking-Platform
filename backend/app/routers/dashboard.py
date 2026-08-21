from datetime import datetime
import math

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.fuel import Fuel
from app.models.maintenance import Maintenance


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ============================================================
# HELPER: PARSE DATETIME
# ============================================================

def parse_datetime(value):

    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):

        value = value.strip()

        if not value:
            return None

        try:

            if value.endswith("Z"):
                value = value[:-1] + "+00:00"

            return datetime.fromisoformat(value)

        except ValueError:

            return None

    return None


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
):

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
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = (
        2
        * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a)
        )
    )

    return earth_radius * c


# ============================================================
# DASHBOARD SUMMARY
# ============================================================
#
# This endpoint is used by:
#
# getDashboardSummary()
#
# It returns LIVE values from PostgreSQL.
#
# ============================================================

@router.get("/")
def get_dashboard_summary(
    db: Session = Depends(get_db)
):

    # ========================================================
    # USERS
    # ========================================================

    total_users = (
        db.query(User)
        .count()
    )


    # ========================================================
    # MANAGERS
    # ========================================================

    managers = (
        db.query(User)
        .filter(
            User.role.ilike("manager")
        )
        .count()
    )


    # ========================================================
    # DRIVERS
    # ========================================================

    total_drivers = (
        db.query(Driver)
        .count()
    )


    # ========================================================
    # VEHICLES
    # ========================================================

    total_vehicles = (
        db.query(Vehicle)
        .count()
    )


    # ========================================================
    # SHIPMENTS
    # ========================================================

    total_shipments = (
        db.query(Shipment)
        .count()
    )


    # ========================================================
    # TRIPS
    # ========================================================

    total_trips = (
        db.query(Trip)
        .count()
    )


    # ========================================================
    # ACTIVE TRIPS
    # ========================================================
    #
    # IMPORTANT:
    # Do NOT count every trip as active.
    #
    # Only trips that are currently in an operational
    # state are counted.
    #
    # ========================================================

    active_trip_statuses = [
        "scheduled",
        "started",
        "in transit",
        "out for delivery"
    ]

    active_trips = (
        db.query(Trip)
        .filter(
            Trip.status.ilike(
                "in transit"
            )
            |
            Trip.status.ilike(
                "scheduled"
            )
            |
            Trip.status.ilike(
                "started"
            )
            |
            Trip.status.ilike(
                "out for delivery"
            )
        )
        .count()
    )


    # ========================================================
    # FUEL RECORDS
    # ========================================================

    total_fuel_records = (
        db.query(Fuel)
        .count()
    )


    # ========================================================
    # MAINTENANCE
    # ========================================================
    #
    # This represents maintenance records.
    #
    # ========================================================

    total_maintenance = (
        db.query(Maintenance)
        .count()
    )


    # ========================================================
    # RETURN SUMMARY
    # ========================================================

    return {

        "users":
            total_users,

        "managers":
            managers,

        "drivers":
            total_drivers,

        "vehicles":
            total_vehicles,

        "shipments":
            total_shipments,

        "trips":
            total_trips,

        "active_trips":
            active_trips,

        "fuel_records":
            total_fuel_records,

        "maintenance":
            total_maintenance
    }


# ============================================================
# DASHBOARD ANALYTICS
# ============================================================

@router.get("/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db)
):

    # ========================================================
    # SHIPMENT STATUS
    # ========================================================

    shipments = (
        db.query(Shipment)
        .all()
    )

    shipment_status_count = {}

    for shipment in shipments:

        status = (
            shipment.status
            or "Unknown"
        )

        status = status.strip()

        shipment_status_count[status] = (
            shipment_status_count.get(
                status,
                0
            ) + 1
        )


    shipment_status = [

        {
            "name": status,
            "value": count
        }

        for status, count
        in shipment_status_count.items()

    ]


    # ========================================================
    # VEHICLE STATUS
    # ========================================================

    vehicles = (
        db.query(Vehicle)
        .all()
    )

    vehicle_status_count = {}

    for vehicle in vehicles:

        status = (
            vehicle.status
            or "Unknown"
        )

        status = status.strip()

        vehicle_status_count[status] = (
            vehicle_status_count.get(
                status,
                0
            ) + 1
        )


    vehicle_status = [

        {
            "name": status,
            "value": count
        }

        for status, count
        in vehicle_status_count.items()

    ]


    # ========================================================
    # MONTHLY SHIPMENTS
    # ========================================================

    monthly_count = {}

    for shipment in shipments:

        shipment_date = None

        # Try created_at first
        if hasattr(
            shipment,
            "created_at"
        ):

            shipment_date = (
                shipment.created_at
            )

        # Otherwise try shipment_date
        elif hasattr(
            shipment,
            "shipment_date"
        ):

            shipment_date = (
                shipment.shipment_date
            )


        shipment_date = parse_datetime(
            shipment_date
        )


        if not shipment_date:
            continue


        month_key = shipment_date.strftime(
            "%Y-%m"
        )


        monthly_count[month_key] = (
            monthly_count.get(
                month_key,
                0
            ) + 1
        )


    monthly_shipments = [

        {
            "month": month,
            "count": count
        }

        for month, count
        in sorted(
            monthly_count.items()
        )

    ]


    # ========================================================
    # RETURN ANALYTICS
    # ========================================================

    return {

        "shipment_status":
            shipment_status,

        "vehicle_status":
            vehicle_status,

        "monthly_shipments":
            monthly_shipments
    }


# ============================================================
# DETAILED DELIVERY STATISTICS
# ============================================================
#
# Used for Operations Analytics.
#
# ============================================================

@router.get("/statistics")
def get_dashboard_statistics(
    db: Session = Depends(get_db)
):

    # ========================================================
    # GET ALL TRIPS
    # ========================================================

    trips = (
        db.query(Trip)
        .all()
    )


    # ========================================================
    # TOTAL DELIVERIES
    # ========================================================

    total_deliveries = len(trips)


    # ========================================================
    # SUCCESSFUL DELIVERIES
    # ========================================================

    successful_deliveries = sum(

        1

        for trip in trips

        if trip.status
        and
        trip.status.strip().lower()
        == "delivered"

    )


    # ========================================================
    # CANCELLED DELIVERIES
    # ========================================================

    cancelled_deliveries = sum(

        1

        for trip in trips

        if trip.status
        and
        trip.status.strip().lower()
        == "cancelled"

    )


    # ========================================================
    # DELAYED DELIVERIES
    # ========================================================

    delayed_deliveries = 0

    now = datetime.utcnow()


    for trip in trips:

        if not trip.status:
            continue


        status = (
            trip.status
            .strip()
            .lower()
        )


        # Explicitly delayed

        if status == "delayed":

            delayed_deliveries += 1

            continue


        # Expected arrival

        expected_arrival = (
            parse_datetime(
                trip.expected_arrival
            )
        )


        # Delivered after expected arrival

        if (

            status == "delivered"

            and
            expected_arrival

        ):

            shipment = (

                db.query(Shipment)

                .filter(
                    Shipment.id
                    ==
                    trip.shipment_id
                )

                .first()

            )


            if shipment:

                delivery_time = (
                    parse_datetime(
                        shipment.delivery_date
                    )
                )


                if (

                    delivery_time
                    and
                    delivery_time
                    >
                    expected_arrival

                ):

                    delayed_deliveries += 1

                    continue


        # Active trip passed expected arrival

        if (

            status
            not in [
                "delivered",
                "cancelled"
            ]

            and
            expected_arrival

        ):

            comparison_now = now


            if (

                expected_arrival.tzinfo
                and
                comparison_now.tzinfo
                is None

            ):

                comparison_now = (
                    comparison_now.replace(
                        tzinfo=
                        expected_arrival.tzinfo
                    )
                )


            elif (

                expected_arrival.tzinfo
                is None
                and
                comparison_now.tzinfo
                is not None

            ):

                comparison_now = (
                    comparison_now.replace(
                        tzinfo=None
                    )
                )


            if (
                expected_arrival
                <
                comparison_now
            ):

                delayed_deliveries += 1


    # ========================================================
    # DELIVERY SUCCESS RATE
    # ========================================================

    if total_deliveries > 0:

        delivery_success_rate = (

            successful_deliveries
            /
            total_deliveries

        ) * 100

    else:

        delivery_success_rate = 0.0


    # ========================================================
    # AVERAGE TRIP DISTANCE
    # ========================================================

    total_distance = 0.0

    trips_with_distance = 0


    for trip in trips:

        try:

            current_latitude = (

                float(
                    trip.current_latitude
                )

                if trip.current_latitude
                else None

            )


            current_longitude = (

                float(
                    trip.current_longitude
                )

                if trip.current_longitude
                else None

            )


            destination_latitude = (

                float(
                    trip.destination_latitude
                )

                if trip.destination_latitude
                else None

            )


            destination_longitude = (

                float(
                    trip.destination_longitude
                )

                if trip.destination_longitude
                else None

            )


            if (

                current_latitude is None
                or
                current_longitude is None
                or
                destination_latitude is None
                or
                destination_longitude is None

            ):

                continue


            distance = haversine_distance(

                current_latitude,
                current_longitude,

                destination_latitude,
                destination_longitude

            )


            total_distance += distance

            trips_with_distance += 1


        except (
            TypeError,
            ValueError
        ):

            continue


    if trips_with_distance > 0:

        average_trip_distance = (

            total_distance
            /
            trips_with_distance

        )

    else:

        average_trip_distance = 0.0


    # ========================================================
    # AVERAGE PLANNED DELIVERY TIME
    # ========================================================

    total_planned_minutes = 0.0

    trips_with_planned_time = 0


    for trip in trips:

        departure_time = (
            parse_datetime(
                trip.departure_time
            )
        )


        expected_arrival = (
            parse_datetime(
                trip.expected_arrival
            )
        )


        if (

            departure_time
            and
            expected_arrival

        ):

            try:

                duration = (

                    expected_arrival
                    -
                    departure_time

                )


                duration_minutes = (

                    duration.total_seconds()
                    /
                    60

                )


                if duration_minutes >= 0:

                    total_planned_minutes += (
                        duration_minutes
                    )

                    trips_with_planned_time += 1


            except TypeError:

                continue


    if trips_with_planned_time > 0:

        average_planned_minutes = (

            total_planned_minutes
            /
            trips_with_planned_time

        )

    else:

        average_planned_minutes = 0.0


    average_planned_hours = (
        average_planned_minutes
        /
        60
    )


    # ========================================================
    # RETURN
    # ========================================================

    return {

        "total_deliveries":
            total_deliveries,

        "successful_deliveries":
            successful_deliveries,

        "delayed_deliveries":
            delayed_deliveries,

        "cancelled_deliveries":
            cancelled_deliveries,

        "delivery_success_rate":
            round(
                delivery_success_rate,
                1
            ),

        "average_trip_distance_km":
            round(
                average_trip_distance,
                2
            ),

        "average_planned_delivery_hours":
            round(
                average_planned_hours,
                1
            )
    }