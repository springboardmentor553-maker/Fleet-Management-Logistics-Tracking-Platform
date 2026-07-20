"""Dashboard router – fleet + shipment summary statistics."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Shipment, ShipmentStatusEnum, User, Vehicle, VehicleStatusEnum
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

    delayed = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == ShipmentStatusEnum.DELAYED)
        .scalar() or 0
    )

    return DashboardSummary(
        # vehicles
        totalVehicles=total_vehicles,
        active=active_vehicles,
        maintenance=maintenance,
        available=available,
        # shipments
        totalShipments=total_shipments,
        activeDeliveries=active_deliveries,
        deliveredShipments=delivered,
        delayedShipments=delayed,
    )