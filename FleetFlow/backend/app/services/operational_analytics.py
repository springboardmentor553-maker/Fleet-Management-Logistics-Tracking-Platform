from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.enums.trip_status import TripStatus

from app.services.maps import get_route


def get_operational_analytics(db: Session):

    trips = (
        db.query(Trip)
        .all()
    )

    total_deliveries = len(trips)

    successful_deliveries = sum(
        1
        for trip in trips
        if trip.trip_status == TripStatus.COMPLETED.value
    )

    cancelled_deliveries = sum(
        1
        for trip in trips
        if trip.trip_status == TripStatus.CANCELLED.value
    )

    delayed_deliveries = sum(
        1
        for trip in trips
        if (
            trip.trip_status == TripStatus.COMPLETED.value
            and trip.completed_at is not None
            and trip.completed_at > trip.scheduled_end_time
        )
    )

    trip_distances = []

    for trip in trips:

        try:
            route = get_route(
                trip.pickup_location,
                trip.delivery_location
            )

            trip_distances.append(
                route["distance_km"]
            )

        except Exception:
            continue

    if trip_distances:
        average_trip_distance = (
            sum(trip_distances)
            / len(trip_distances)
        )
    else:
        average_trip_distance = 0


    delivery_times = []

    for trip in trips:

        if (
            trip.started_at is not None
            and trip.completed_at is not None
        ):
            delivery_time = (
                trip.completed_at
                - trip.started_at
            ).total_seconds() / 60

            if delivery_time >= 0:
                delivery_times.append(
                    delivery_time
                )

    if delivery_times:
        average_delivery_time = (
            sum(delivery_times)
            / len(delivery_times)
        )
    else:
        average_delivery_time = 0

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance": round(
            average_trip_distance,
            2
        ),
        "average_delivery_time_minutes": round(
            average_delivery_time,
            2
        )
    }