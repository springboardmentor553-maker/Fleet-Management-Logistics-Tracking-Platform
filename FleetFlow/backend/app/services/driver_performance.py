from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.enums.trip_status import TripStatus


def get_driver_performance(
    db: Session,
    driver_id: int
):

    trips = (
        db.query(Trip)
        .filter(Trip.driver_id == driver_id)
        .all()
    )

    total_trips = len(trips)

    completed_trips = sum(
        1
        for trip in trips
        if trip.trip_status == TripStatus.COMPLETED.value
    )

    active_trips = sum(
        1
        for trip in trips
        if trip.trip_status in [
            TripStatus.SCHEDULED.value,
            TripStatus.STARTED.value,
            TripStatus.IN_PROGRESS.value
        ]
    )

    cancelled_trips = sum(
        1
        for trip in trips
        if trip.trip_status == TripStatus.CANCELLED.value
    )

    return {
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips
    }