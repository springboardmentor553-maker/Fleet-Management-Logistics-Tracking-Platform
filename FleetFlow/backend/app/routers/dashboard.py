"""Dashboard router – fleet + shipment summary statistics."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import (
    Shipment,
    ShipmentStatusEnum,
    User,
    Vehicle,
    VehicleStatusEnum,
)
from app.schemas.dashboard import DashboardSummary
from app.services.security import get_current_user

router = APIRouter()

# Statuses that count as an "active delivery" in progress
_ACTIVE_DELIVERY_STATUSES = (
    ShipmentStatusEnum.ASSIGNED,
    ShipmentStatusEnum.PICKED_UP,
    ShipmentStatusEnum.IN_TRANSIT,
    ShipmentStatusEnum.OUT_FOR_DELIVERY,
)


@router.get(
    "/dashboard",
    response_model=DashboardSummary,
    summary="Fleet & shipment dashboard summary",
    description=(
        "Returns aggregate counts for vehicles (total, active, maintenance, available) "
        "and shipments (total, active deliveries, delivered, delayed)."
    ),
    tags=["dashboard"],
)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    # ── Vehicles ──────────────────────────────────────────────────────────────
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    active_vehicles = (
        db.query(func.count(Vehicle.id))
        .filter(Vehicle.current_status == VehicleStatusEnum.IN_USE)
        .scalar() or 0
    )
    maintenance = (
        db.query(func.count(Vehicle.id))
        .filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE)
        .scalar() or 0
    )
    available = (
        db.query(func.count(Vehicle.id))
        .filter(Vehicle.current_status == VehicleStatusEnum.AVAILABLE)
        .scalar() or 0
    )

    # ── Shipments ─────────────────────────────────────────────────────────────
    total_shipments = db.query(func.count(Shipment.id)).scalar() or 0

    active_deliveries = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status.in_(_ACTIVE_DELIVERY_STATUSES))
        .scalar() or 0
    )

    delivered = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == ShipmentStatusEnum.DELIVERED)
        .scalar() or 0
    )

    from datetime import datetime
    delayed = (
        db.query(func.count(Shipment.id))
        .filter(
            (Shipment.status == ShipmentStatusEnum.DELAYED) | 
            ((Shipment.eta < datetime.utcnow()) & ~Shipment.status.in_([ShipmentStatusEnum.DELIVERED, ShipmentStatusEnum.CANCELLED]))
        )
        .scalar() or 0
    )

    # ── Drivers ───────────────────────────────────────────────────────────────
    from app.models.driver import Driver
    from app.models.enums import DriverStatusEnum
    total_drivers = db.query(func.count(Driver.id)).scalar() or 0
    on_duty_drivers = (
        db.query(func.count(Driver.id))
        .filter(Driver.status == DriverStatusEnum.ON_DUTY)
        .scalar() or 0
    )

    return DashboardSummary(
        # vehicles
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        maintenance_vehicles=maintenance,
        available_vehicles=available,
        # drivers
        total_drivers=total_drivers,
        on_duty_drivers=on_duty_drivers,
        # shipments
        total_shipments=total_shipments,
        active_shipments=active_deliveries,
        delivered_shipments=delivered,
        delayed_shipments=delayed,
    )