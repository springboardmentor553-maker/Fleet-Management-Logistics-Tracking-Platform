from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import ShipmentStatus, VehicleStatus
from app.db.session import get_db
from app.modules.fleet.models import Vehicle
from app.modules.maintenance.models import MaintenanceLog
from app.modules.shipments.models import Shipment

router = APIRouter(prefix="/reports", tags=["Reports"])


class VehicleUtilizationRow(BaseModel):
    vehicle_id: int
    plate_number: str
    status: VehicleStatus
    completed_shipments: int
    total_distance_related_cost: float


class FleetUtilizationReport(BaseModel):
    generated_for_range: str
    rows: list[VehicleUtilizationRow]


class DeliveryPerformanceReport(BaseModel):
    generated_for_range: str
    total_shipments: int
    delivered_on_time_ratio: float
    average_transit_hours: float | None
    cancelled_count: int


@router.get("/fleet-utilization", response_model=FleetUtilizationReport)
def fleet_utilization(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> FleetUtilizationReport:
    vehicles = db.scalars(select(Vehicle)).all()
    rows: list[VehicleUtilizationRow] = []

    for vehicle in vehicles:
        completed_query = select(func.count()).select_from(Shipment).where(
            Shipment.vehicle_id == vehicle.id, Shipment.status == ShipmentStatus.DELIVERED
        )
        completed = db.scalar(completed_query) or 0

        cost_query = select(func.coalesce(func.sum(MaintenanceLog.cost), 0)).where(
            MaintenanceLog.vehicle_id == vehicle.id
        )
        maintenance_cost = float(db.scalar(cost_query) or 0)

        rows.append(
            VehicleUtilizationRow(
                vehicle_id=vehicle.id,
                plate_number=vehicle.plate_number,
                status=vehicle.status,
                completed_shipments=completed,
                total_distance_related_cost=maintenance_cost,
            )
        )

    range_label = f"{start or 'all-time'} to {end or 'present'}"
    return FleetUtilizationReport(generated_for_range=range_label, rows=rows)


@router.get("/delivery-performance", response_model=DeliveryPerformanceReport)
def delivery_performance(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DeliveryPerformanceReport:
    query = select(Shipment)
    if start is not None:
        query = query.where(func.date(Shipment.scheduled_at) >= start)
    if end is not None:
        query = query.where(func.date(Shipment.scheduled_at) <= end)

    shipments = db.scalars(query).all()
    total = len(shipments)
    delivered = [s for s in shipments if s.status == ShipmentStatus.DELIVERED]
    cancelled_count = sum(1 for s in shipments if s.status == ShipmentStatus.CANCELLED)

    on_time_ratio = (len(delivered) / total) if total else 0.0

    durations_hours = [
        (s.delivered_at - s.scheduled_at).total_seconds() / 3600
        for s in delivered
        if s.delivered_at is not None
    ]
    avg_hours = sum(durations_hours) / len(durations_hours) if durations_hours else None

    range_label = f"{start or 'all-time'} to {end or 'present'}"
    return DeliveryPerformanceReport(
        generated_for_range=range_label,
        total_shipments=total,
        delivered_on_time_ratio=round(on_time_ratio, 4),
        average_transit_hours=round(avg_hours, 2) if avg_hours is not None else None,
        cancelled_count=cancelled_count,
    )
