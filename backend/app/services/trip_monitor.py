import asyncio
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models


# =========================================================
# TRIP STATUS VALUES
# =========================================================

SCHEDULED_STATUSES = {
    "scheduled",
    "created",
    "assigned",
}

IN_TRANSIT_STATUSES = {
    "in transit",
    "in_transit",
    "started",
}

COMPLETED_STATUSES = {
    "completed",
    "complete",
}

CANCELLED_STATUSES = {
    "cancelled",
    "canceled",
}


# =========================================================
# NORMALIZE STATUS
# =========================================================

def normalize_status(status):
    if status is None:
        return ""

    if hasattr(status, "value"):
        status = status.value

    return str(status).strip().lower()


# =========================================================
# UPDATE ONE TRIP
# =========================================================

def process_trip(
    db: Session,
    trip,
):
    """
    Process one trip.

    Lifecycle:

        Scheduled
             ↓
        In Transit
             ↓
        Completed

    The browser is NOT involved in this process.
    """

    now = datetime.now(timezone.utc)

    status = normalize_status(
        trip.trip_status
    )

    # -----------------------------------------------------
    # Already completed
    # -----------------------------------------------------

    if status in COMPLETED_STATUSES:
        return False

    # -----------------------------------------------------
    # Cancelled trips are not processed
    # -----------------------------------------------------

    if status in CANCELLED_STATUSES:
        return False

    # -----------------------------------------------------
    # Scheduled → In Transit
    # -----------------------------------------------------

    if (
        status in SCHEDULED_STATUSES
        and trip.scheduled_start_time
    ):

        start_time = trip.scheduled_start_time

        # Make naive datetime timezone-aware
        if start_time.tzinfo is None:
            start_time = start_time.replace(
                tzinfo=timezone.utc
            )

        if now >= start_time:

            trip.trip_status = "In Transit"

            db.commit()

            print(
                f"[TRIP MONITOR] "
                f"Trip {trip.id} started."
            )

            status = "in transit"

    # -----------------------------------------------------
    # In Transit → Completed
    # -----------------------------------------------------

    if (
        status in IN_TRANSIT_STATUSES
        and trip.scheduled_end_time
    ):

        end_time = trip.scheduled_end_time

        if end_time.tzinfo is None:
            end_time = end_time.replace(
                tzinfo=timezone.utc
            )

        if now >= end_time:

            trip.trip_status = "Completed"

            db.commit()

            print(
                f"[TRIP MONITOR] "
                f"Trip {trip.id} completed."
            )

            return True

    return False


# =========================================================
# CHECK ALL ACTIVE TRIPS
# =========================================================

def process_active_trips():

    db = SessionLocal()

    try:

        trips = (
            db.query(models.Trip)
            .all()
        )

        for trip in trips:

            try:

                process_trip(
                    db,
                    trip,
                )

            except Exception as error:

                db.rollback()

                print(
                    f"[TRIP MONITOR] "
                    f"Trip {trip.id} error: "
                    f"{error}"
                )

    finally:

        db.close()


# =========================================================
# BACKGROUND MONITOR
# =========================================================

async def trip_monitor():

    print(
        "[TRIP MONITOR] "
        "Background trip monitor started."
    )

    while True:

        try:

            await asyncio.to_thread(
                process_active_trips
            )

        except Exception as error:

            print(
                "[TRIP MONITOR] "
                f"Monitor error: {error}"
            )

        # Check every 10 seconds
        await asyncio.sleep(10)