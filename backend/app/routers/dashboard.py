from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal

from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment

from app.services.status_sync_service import (
    sync_all_trip_shipment_statuses,
)


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ==========================================================
# DATABASE DEPENDENCY
# ==========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==========================================================
# DASHBOARD
# ==========================================================

@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
):

    # ======================================================
    # B7
    # SYNCHRONIZE TRIP → SHIPMENT STATUS
    # ======================================================

    try:

        sync_all_trip_shipment_statuses(
            db
        )

    except Exception as error:

        print(
            "DASHBOARD STATUS SYNC ERROR:",
            error,
        )

        db.rollback()

    # ======================================================
    # TOTAL DRIVERS
    # ======================================================

    total_drivers = (
        db.query(Driver)
        .count()
    )

    # ======================================================
    # TOTAL VEHICLES
    # ======================================================

    total_vehicles = (
        db.query(Vehicle)
        .count()
    )

    # ======================================================
    # TOTAL SHIPMENTS
    # ======================================================

    total_shipments = (
        db.query(Shipment)
        .count()
    )

    # ======================================================
    # AVAILABLE DRIVERS
    # ======================================================

    available_drivers = (
        db.query(Driver)
        .filter(
            Driver.status == "Available"
        )
        .count()
    )

    # ======================================================
    # AVAILABLE VEHICLES
    # ======================================================

    available_vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.status == "Available"
        )
        .count()
    )

    # ======================================================
    # ACTIVE DELIVERIES
    #
    # Active:
    #
    # Assigned
    # Picked Up
    # In Transit
    # Out for Delivery
    #
    # Delayed is NOT counted as active.
    # ======================================================

    active_statuses = [
        "Assigned",
        "Picked Up",
        "In Transit",
        "Out for Delivery",
    ]

    active_deliveries = (
        db.query(Shipment)
        .filter(
            Shipment.current_status.in_(
                active_statuses
            )
        )
        .count()
    )

    # ======================================================
    # DELIVERED SHIPMENTS
    # ======================================================

    delivered_shipments = (
        db.query(Shipment)
        .filter(
            Shipment.current_status
            == "Delivered"
        )
        .count()
    )

    # ======================================================
    # DELAYED SHIPMENTS
    # ======================================================

    delayed_shipments = (
        db.query(Shipment)
        .filter(
            Shipment.current_status
            == "Delayed"
        )
        .count()
    )

    # ======================================================
    # RETURN DASHBOARD DATA
    # ======================================================

    return {

        "total_drivers":
            total_drivers,

        "total_vehicles":
            total_vehicles,

        "total_shipments":
            total_shipments,

        "available_drivers":
            available_drivers,

        "available_vehicles":
            available_vehicles,

        "active_deliveries":
            active_deliveries,

        "delivered_shipments":
            delivered_shipments,

        "delayed_shipments":
            delayed_shipments,

    }