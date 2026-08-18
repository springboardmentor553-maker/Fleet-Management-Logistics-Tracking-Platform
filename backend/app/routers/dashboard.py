from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


router = APIRouter()


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
):
    # =========================================================
    # BASIC TOTALS
    # =========================================================

    total_users = (
        db.query(models.User)
        .count()
    )

    total_vehicles = (
        db.query(models.Vehicle)
        .count()
    )

    total_drivers = (
        db.query(models.Driver)
        .count()
    )

    total_shipments = (
        db.query(models.Shipment)
        .count()
    )

    total_routes = (
        db.query(models.Route)
        .count()
    )

    total_maintenance = (
        db.query(models.MaintenanceRecord)
        .count()
    )

    # =========================================================
    # VEHICLE STATUS
    # =========================================================

    vehicle_status_rows = (
        db.query(
            models.Vehicle.status,
            func.count(models.Vehicle.id),
        )
        .group_by(models.Vehicle.status)
        .all()
    )

    vehicle_status = {}

    for status, count in vehicle_status_rows:

        if hasattr(status, "value"):
            status = status.value

        status = str(status).strip().lower()

        vehicle_status[status] = count

    available_vehicles = (
        vehicle_status.get("available", 0)
    )

    maintenance_vehicles = (
        vehicle_status.get("maintenance", 0)
    )

    # =========================================================
    # BUSY VEHICLES
    #
    # A vehicle is considered busy when it is assigned to a
    # trip that is currently Started or In Transit.
    #
    # DISTINCT is important because the same vehicle can appear
    # in more than one trip record.
    # =========================================================

    busy_vehicles = (
        db.query(
            func.count(
                func.distinct(
                    models.Trip.vehicle_id
                )
            )
        )
        .filter(
            models.Trip.trip_status.in_(
                [
                    "Started",
                    "In Transit",
                    "started",
                    "in transit",
                ]
            )
        )
        .scalar()
        or 0
    )

    # =========================================================
    # SHIPMENT STATUS
    # =========================================================

    shipment_status_rows = (
        db.query(
            models.Shipment.current_status,
            func.count(models.Shipment.id),
        )
        .group_by(
            models.Shipment.current_status
        )
        .all()
    )

    shipment_status = {}

    for status, count in shipment_status_rows:

        if hasattr(status, "value"):
            status = status.value

        if status is None:
            continue

        status = str(status).strip().lower()

        shipment_status[status] = count

    # =========================================================
    # SHIPMENT COUNTS
    # =========================================================

    delivered_shipments = (
        shipment_status.get("delivered", 0)
    )

    transit_shipments = (
        shipment_status.get("in transit", 0)
    )

    # Pending means shipment is created, assigned,
    # or picked up but not yet delivered/in transit.
    pending_shipments = sum(
        shipment_status.get(status, 0)
        for status in [
            "created",
            "assigned",
            "picked up",
        ]
    )

    # =========================================================
    # OUT OF SERVICE
    #
    # If your database uses another status later, it can be
    # added here.
    # =========================================================

    out_of_service = (
        vehicle_status.get("out of service", 0)
        + vehicle_status.get("out_of_service", 0)
        + vehicle_status.get("inactive", 0)
    )

    # =========================================================
    # DRIVER STATUS
    # =========================================================

    driver_status_rows = (
        db.query(
            models.Driver.status,
            func.count(models.Driver.id),
        )
        .group_by(models.Driver.status)
        .all()
    )

    driver_status = {}

    for status, count in driver_status_rows:

        if hasattr(status, "value"):
            status = status.value

        if status is None:
            continue

        status = str(status).strip().lower()

        driver_status[status] = count

    # =========================================================
    # UNREAD NOTIFICATIONS
    # =========================================================

    unread_notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.status != "read"
        )
        .count()
    )

    # =========================================================
    # FINAL RESPONSE
    # =========================================================

    return {

        # -----------------------------------------------------
        # TOTALS
        # -----------------------------------------------------

        "users": total_users,

        "vehicles": total_vehicles,

        "drivers": total_drivers,

        "shipments": total_shipments,

        "routes": total_routes,

        "maintenance_records": total_maintenance,

        # -----------------------------------------------------
        # DASHBOARD VEHICLE CARDS
        # -----------------------------------------------------

        "available": available_vehicles,

        "busy": busy_vehicles,

        "maintenance": maintenance_vehicles,

        "out_of_service": out_of_service,

        # -----------------------------------------------------
        # DASHBOARD SHIPMENT CARDS
        # -----------------------------------------------------

        "pending_shipments": pending_shipments,

        "transit": transit_shipments,

        "delivered": delivered_shipments,

        # -----------------------------------------------------
        # DETAILED STATUS DATA
        # -----------------------------------------------------

        "vehicle_status": vehicle_status,

        "driver_status": driver_status,

        "shipment_status": shipment_status,

        # -----------------------------------------------------
        # NOTIFICATIONS
        # -----------------------------------------------------

        "unread_notifications":
            unread_notifications,
    }