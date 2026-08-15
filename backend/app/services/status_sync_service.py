from datetime import datetime

from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.shipment import Shipment


# ==========================================================
# STATUS MAPPING
# ==========================================================

TRIP_TO_SHIPMENT_STATUS = {
    "Scheduled": "Assigned",
    "In Progress": "In Transit",
    "In Transit": "In Transit",
    "Completed": "Delivered",
    "Cancelled": "Cancelled",
    "Delayed": "Delayed",
}


# ==========================================================
# SYNCHRONIZE ONE TRIP WITH ITS SHIPMENT
# ==========================================================

def sync_trip_shipment_status(
    db: Session,
    trip: Trip,
    commit: bool = True,
):
    """
    Keep Trip status and Shipment status synchronized.

    Trip -> Shipment

    Scheduled   -> Assigned
    In Progress -> In Transit
    In Transit  -> In Transit
    Completed   -> Delivered
    Cancelled   -> Cancelled
    Delayed     -> Delayed
    """

    if trip is None:
        return None

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == trip.shipment_id
        )
        .first()
    )

    if shipment is None:
        return None

    trip_status = (
        str(trip.trip_status or "Scheduled")
        .strip()
    )

    # ------------------------------------------------------
    # AUTOMATIC DELAY DETECTION
    # ------------------------------------------------------

    now = datetime.utcnow()

    if (
        trip_status in {
            "Scheduled",
            "In Progress",
            "In Transit",
        }
        and trip.scheduled_end_time is not None
        and now > trip.scheduled_end_time
        and float(trip.progress or 0) < 100
    ):
        trip_status = "Delayed"

        trip.trip_status = "Delayed"

    # ------------------------------------------------------
    # GET SHIPMENT STATUS
    # ------------------------------------------------------

    shipment_status = (
        TRIP_TO_SHIPMENT_STATUS.get(
            trip_status
        )
    )

    if shipment_status is not None:

        shipment.current_status = (
            shipment_status
        )

    if commit:

        db.commit()

        db.refresh(trip)

        db.refresh(shipment)

    return {
        "trip_status": trip.trip_status,
        "shipment_status": shipment.current_status,
    }


# ==========================================================
# SYNCHRONIZE ALL TRIPS
# ==========================================================

def sync_all_trip_shipment_statuses(
    db: Session,
):
    """
    Synchronize every trip with its shipment.

    This is useful for dashboard/API requests.
    """

    trips = (
        db.query(Trip)
        .all()
    )

    changed = False

    now = datetime.utcnow()

    for trip in trips:

        shipment = (
            db.query(Shipment)
            .filter(
                Shipment.id == trip.shipment_id
            )
            .first()
        )

        if shipment is None:
            continue

        original_trip_status = (
            trip.trip_status
        )

        original_shipment_status = (
            shipment.current_status
        )

        trip_status = (
            str(
                trip.trip_status
                or "Scheduled"
            ).strip()
        )

        # --------------------------------------------------
        # AUTOMATIC DELAY
        # --------------------------------------------------

        if (
            trip_status in {
                "Scheduled",
                "In Progress",
                "In Transit",
            }
            and trip.scheduled_end_time
            and now > trip.scheduled_end_time
            and float(trip.progress or 0) < 100
        ):

            trip_status = "Delayed"

            trip.trip_status = "Delayed"

        # --------------------------------------------------
        # MAP TRIP → SHIPMENT
        # --------------------------------------------------

        shipment_status = (
            TRIP_TO_SHIPMENT_STATUS.get(
                trip_status
            )
        )

        if shipment_status is not None:

            shipment.current_status = (
                shipment_status
            )

        if (
            original_trip_status
            != trip.trip_status
            or
            original_shipment_status
            != shipment.current_status
        ):
            changed = True

    if changed:

        db.commit()

    return trips