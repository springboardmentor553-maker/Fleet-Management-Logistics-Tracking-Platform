from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.analytics import (
    FleetDashboardResponse,
    FuelAnalyticsResponse,
    OperationsAnalyticsResponse,
    VehicleFuelUsage,
)

router = APIRouter()


@router.get("/fuel", response_model=FuelAnalyticsResponse)
def get_fuel_analytics(db: Session = Depends(get_db)):
    """
    Fuel Analytics API (Task 3 requirement).
    Calculates total fuel consumed, total fuel cost, average fuel consumption,
    and identifies vehicles with highest and lowest fuel usage.
    """
    total_liters = db.query(func.coalesce(func.sum(models.FuelRecord.liters), 0.0)).scalar() or 0.0
    total_cost = db.query(func.coalesce(func.sum(models.FuelRecord.total_cost), 0.0)).scalar() or 0.0

    record_count = db.query(models.FuelRecord).count()
    avg_consumption = (total_liters / record_count) if record_count > 0 else 0.0

    vehicle_usage_query = (
        db.query(
            models.Vehicle.id,
            models.Vehicle.vehicle_number,
            func.coalesce(func.sum(models.FuelRecord.liters), 0.0).label("total_liters"),
        )
        .join(models.FuelRecord, models.FuelRecord.vehicle_id == models.Vehicle.id)
        .group_by(models.Vehicle.id, models.Vehicle.vehicle_number)
        .having(func.sum(models.FuelRecord.liters) > 0)
        .all()
    )

    highest_vehicle = None
    lowest_vehicle = None

    if vehicle_usage_query:
        sorted_vehicles = sorted(vehicle_usage_query, key=lambda v: v[2], reverse=True)
        highest_v = sorted_vehicles[0]
        lowest_v = sorted_vehicles[-1]

        highest_vehicle = VehicleFuelUsage(
            vehicle_id=highest_v[0],
            vehicle_number=highest_v[1],
            total_liters=round(float(highest_v[2]), 2),
        )
        lowest_vehicle = VehicleFuelUsage(
            vehicle_id=lowest_v[0],
            vehicle_number=lowest_v[1],
            total_liters=round(float(lowest_v[2]), 2),
        )

    return FuelAnalyticsResponse(
        total_fuel_consumed=round(float(total_liters), 2),
        total_fuel_cost=round(float(total_cost), 2),
        average_fuel_consumption=round(float(avg_consumption), 2),
        vehicle_with_highest_fuel_usage=highest_vehicle,
        vehicle_with_lowest_fuel_usage=lowest_vehicle,
    )


@router.get("/operations", response_model=OperationsAnalyticsResponse)
def get_operational_analytics(db: Session = Depends(get_db)):
    """
    Operational Analytics API (Task 5 requirement).
    Calculates delivery statistics, average trip distance, and average delivery time.
    """
    total_deliveries = db.query(models.Shipment).count()
    successful_deliveries = db.query(models.Shipment).filter(
        models.Shipment.status == models.ShipmentStatus.DELIVERED
    ).count()
    delayed_deliveries = db.query(models.Shipment).filter(
        models.Shipment.status == models.ShipmentStatus.DELAYED
    ).count()
    cancelled_deliveries = db.query(models.Shipment).filter(
        models.Shipment.status == models.ShipmentStatus.CANCELLED
    ).count()

    avg_distance = db.query(func.coalesce(func.avg(models.Route.distance_km), 0.0)).scalar() or 0.0
    avg_duration = db.query(func.coalesce(func.avg(models.Route.estimated_duration_hours), 0.0)).scalar() or 0.0

    return OperationsAnalyticsResponse(
        total_deliveries=total_deliveries,
        successful_deliveries=successful_deliveries,
        delayed_deliveries=delayed_deliveries,
        cancelled_deliveries=cancelled_deliveries,
        average_trip_distance=round(float(avg_distance), 2),
        average_delivery_time=round(float(avg_duration), 2),
    )
