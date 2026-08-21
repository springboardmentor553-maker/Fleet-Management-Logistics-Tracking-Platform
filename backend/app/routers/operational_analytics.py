from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

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
    # DELIVERY STATISTICS
    # ========================================================

    total_deliveries = (
        db.query(Trip)
        .count()
    )

    successful_deliveries = (
        db.query(Trip)
        .filter(
            func.lower(func.trim(Trip.status)) == "delivered"
        )
        .count()
    )

    # A trip is delayed if not delivered or cancelled, and past expected arrival
    from datetime import datetime
    now = datetime.now()

    delayed_deliveries = (
        db.query(Trip)
        .filter(
            func.lower(func.trim(Trip.status)).notin_(["delivered", "cancelled"]),
            Trip.expected_arrival.isnot(None),
            Trip.expected_arrival < now
        )
        .count()
    )

    cancelled_deliveries = (
        db.query(Trip)
        .filter(
            func.lower(func.trim(Trip.status)) == "cancelled"
        )
        .count()
    )



    # ========================================================
    # AVERAGE TRIP DISTANCE
    # ========================================================

    average_trip_distance = (
        db.query(
            func.avg(Trip.distance)
        )
        .scalar()
    )

    if average_trip_distance is None:
        average_trip_distance = 0


    # ========================================================
    # AVERAGE DELIVERY TIME
    # ========================================================

    completed_trips = (
        db.query(Trip)
        .filter(
            Trip.actual_arrival.isnot(None),
            Trip.departure_time.isnot(None)
        )
        .all()
    )


    total_hours = 0.0

    valid_completed_trips = 0


    for trip in completed_trips:

        try:

            departure = trip.departure_time
            arrival = trip.actual_arrival


            # ------------------------------------------------
            # Handle datetime values
            # ------------------------------------------------

            if isinstance(departure, str):

                departure = datetime.fromisoformat(
                    departure
                )


            if isinstance(arrival, str):

                arrival = datetime.fromisoformat(
                    arrival
                )


            # ------------------------------------------------
            # Calculate duration
            # ------------------------------------------------

            duration_seconds = (
                arrival - departure
            ).total_seconds()


            # Prevent negative/invalid durations
            if duration_seconds >= 0:

                total_hours += (
                    duration_seconds / 3600
                )

                valid_completed_trips += 1


        except Exception as error:

            print(
                f"Could not calculate delivery time "
                f"for Trip ID {trip.id}: {error}"
            )


    # ========================================================
    # FINAL AVERAGE DELIVERY TIME
    # ========================================================

    if valid_completed_trips > 0:

        average_delivery_time_hours = (
            total_hours /
            valid_completed_trips
        )

    else:

        average_delivery_time_hours = 0


    # ========================================================
    # SUCCESS RATE
    # ========================================================

    if total_deliveries > 0:

        success_rate = (
            successful_deliveries /
            total_deliveries
        ) * 100

    else:

        success_rate = 0


    # ========================================================
    # DELAY RATE
    # ========================================================

    if total_deliveries > 0:

        delay_rate = (
            delayed_deliveries /
            total_deliveries
        ) * 100

    else:

        delay_rate = 0


    # ========================================================
    # CANCELLATION RATE
    # ========================================================

    if total_deliveries > 0:

        cancellation_rate = (
            cancelled_deliveries /
            total_deliveries
        ) * 100

    else:

        cancellation_rate = 0


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "total_deliveries": total_deliveries,

        "successful_deliveries":
            successful_deliveries,

        "delayed_deliveries":
            delayed_deliveries,

        "cancelled_deliveries":
            cancelled_deliveries,

        "average_trip_distance":
            round(
                float(average_trip_distance),
                2
            ),

        "average_delivery_time_hours":
            round(
                float(average_delivery_time_hours),
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