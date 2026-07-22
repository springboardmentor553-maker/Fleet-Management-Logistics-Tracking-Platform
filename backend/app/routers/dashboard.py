"""
Dashboard router — GET /dashboard/summary

Returns high-level shipment counts using efficient SQLAlchemy COUNT queries.
No rows are fetched into memory; only scalar counts are returned.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.utils.security import has_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Statuses that count toward "active deliveries"
_ACTIVE_STATUSES = (
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKED_UP,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(has_role(["Admin", "Dispatcher", "Fleet Manager"])),
):
    """
    Return a summary of shipment counts for the dashboard.

    All counts are performed with a single efficient SQLAlchemy scalar query
    per metric — no rows are fetched into Python memory.

    Returns
    -------
    {
        "total_shipments": int,
        "active_deliveries": int,       # Assigned + Picked Up + In Transit + Out for Delivery
        "delivered_shipments": int,     # Delivered
        "delayed_shipments": int,       # Delayed
    }
    """
    # COUNT(all shipments)
    total_shipments: int = db.query(func.count(Shipment.id)).scalar()

    # COUNT where status IN (Assigned, Picked Up, In Transit, Out for Delivery)
    active_deliveries: int = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.current_status.in_(_ACTIVE_STATUSES))
        .scalar()
    )

    # COUNT where status = Delivered
    delivered_shipments: int = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.current_status == ShipmentStatus.DELIVERED)
        .scalar()
    )

    # COUNT where status = Delayed
    delayed_shipments: int = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.current_status == ShipmentStatus.DELAYED)
        .scalar()
    )

    return {
        "total_shipments": total_shipments,
        "active_deliveries": active_deliveries,
        "delivered_shipments": delivered_shipments,
        "delayed_shipments": delayed_shipments,
    }
