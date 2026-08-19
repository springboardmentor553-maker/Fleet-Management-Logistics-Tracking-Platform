from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.route import Route
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip
from app.schemas.operation_analytics import OperationAnalyticsResponse

router = APIRouter(
    prefix="/analytics",
    tags=["Operational Analytics"]
)


@router.get("/operations", response_model=OperationAnalyticsResponse)
def operation_analytics(db: Session = Depends(get_db)):

    total_deliveries = (
        db.query(func.count(Shipment.id)).scalar() or 0
    )

    successful_deliveries = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == ShipmentStatus.DELIVERED)
        .scalar() or 0
    )

    delayed_deliveries = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == ShipmentStatus.DELAYED)
        .scalar() or 0
    )

    cancelled_deliveries = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == ShipmentStatus.CANCELLED)
        .scalar() or 0
    )

    average_trip_distance = (
        db.query(func.avg(Route.distance))
        .join(Trip, Trip.route_id == Route.id)
        .scalar() or 0
    )

    # Cannot average because estimated_time is stored as String
    average_delivery_time = 0.0

    return OperationAnalyticsResponse(
    total_deliveries=total_deliveries,
    successful_deliveries=successful_deliveries,
    delayed_deliveries=delayed_deliveries,
    cancelled_deliveries=cancelled_deliveries,
    average_trip_distance=round(float(average_trip_distance), 2),
    average_delivery_time=0.0
)