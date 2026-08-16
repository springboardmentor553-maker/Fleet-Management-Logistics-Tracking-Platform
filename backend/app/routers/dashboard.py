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
    vehicle_counts = db.query(Vehicle.current_status, func.count(Vehicle.id)).group_by(Vehicle.current_status).all()
    v_stats = dict(vehicle_counts)
    total_vehicles = sum(v_stats.values())
    active_vehicles = v_stats.get(VehicleStatusEnum.IN_USE, 0)
    maintenance = v_stats.get(VehicleStatusEnum.MAINTENANCE, 0)
    available = v_stats.get(VehicleStatusEnum.AVAILABLE, 0)

    # ── Shipments ─────────────────────────────────────────────────────────────
    shipment_counts = db.query(Shipment.status, func.count(Shipment.id)).group_by(Shipment.status).all()
    s_stats = dict(shipment_counts)
    total_shipments = sum(s_stats.values())
    active_deliveries = sum(s_stats.get(st, 0) for st in _ACTIVE_DELIVERY_STATUSES)
    delivered = s_stats.get(ShipmentStatusEnum.DELIVERED, 0)

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
    
    driver_counts = db.query(Driver.status, func.count(Driver.id)).group_by(Driver.status).all()
    d_stats = dict(driver_counts)
    total_drivers = sum(d_stats.values())
    on_duty_drivers = d_stats.get(DriverStatusEnum.ON_DUTY, 0)

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