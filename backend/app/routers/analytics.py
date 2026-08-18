from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceRecord
from app.models.route import Route
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle
from app.utils.security import require_role


router = APIRouter(
    prefix="/analytics",
    tags=["Fleet Analytics"]
)


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    total_vehicles = db.query(Vehicle).count()
    total_drivers = db.query(Driver).count()
    total_shipments = db.query(Shipment).count()
    total_trips = db.query(Trip).count()

    vehicles_under_maintenance = (
        db.query(Vehicle)
        .filter(Vehicle.status == "maintenance")
        .count()
    )

    total_maintenance_cost = (
        db.query(func.sum(MaintenanceRecord.cost))
        .scalar()
        or 0
    )

    total_fuel_cost = (
        db.query(func.sum(FuelLog.fuel_cost))
        .scalar()
        or 0
    )

    total_fuel_quantity = (
        db.query(func.sum(FuelLog.fuel_quantity))
        .scalar()
        or 0
    )

    return {
        "total_vehicles": total_vehicles,
        "total_drivers": total_drivers,
        "total_shipments": total_shipments,
        "total_trips": total_trips,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "total_maintenance_cost": total_maintenance_cost,
        "total_fuel_cost": total_fuel_cost,
        "total_fuel_quantity": total_fuel_quantity,
    }


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    return {
        "total_vehicles": db.query(Vehicle).count(),
        "total_drivers": db.query(Driver).count(),
        "total_shipments": db.query(Shipment).count(),
        "total_trips": db.query(Trip).count(),
        "total_maintenance": db.query(MaintenanceRecord).count(),
        "total_fuel_logs": db.query(FuelLog).count(),
    }


@router.get("/fuel")
def fuel_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    total_fuel_consumed = (
        db.query(func.sum(FuelLog.fuel_quantity))
        .scalar()
        or 0
    )

    total_fuel_cost = (
        db.query(func.sum(FuelLog.fuel_cost))
        .scalar()
        or 0
    )

    average_fuel_consumption = (
        db.query(func.avg(FuelLog.fuel_quantity))
        .scalar()
        or 0
    )

    highest_usage = (
        db.query(
            Vehicle.license_plate,
            func.sum(FuelLog.fuel_quantity).label("fuel_used"),
        )
        .join(FuelLog, FuelLog.vehicle_id == Vehicle.id)
        .group_by(Vehicle.license_plate)
        .order_by(func.sum(FuelLog.fuel_quantity).desc())
        .first()
    )

    lowest_usage = (
        db.query(
            Vehicle.license_plate,
            func.sum(FuelLog.fuel_quantity).label("fuel_used"),
        )
        .join(FuelLog, FuelLog.vehicle_id == Vehicle.id)
        .group_by(Vehicle.license_plate)
        .order_by(func.sum(FuelLog.fuel_quantity).asc())
        .first()
    )

    return {
        "total_fuel_consumed": total_fuel_consumed,
        "total_fuel_cost": total_fuel_cost,
        "average_fuel_consumption": round(
            average_fuel_consumption,
            2,
        ),
        "vehicle_with_highest_fuel_usage": (
            highest_usage.license_plate
            if highest_usage
            else None
        ),
        "highest_fuel_used": (
            highest_usage.fuel_used
            if highest_usage
            else 0
        ),
        "vehicle_with_lowest_fuel_usage": (
            lowest_usage.license_plate
            if lowest_usage
            else None
        ),
        "lowest_fuel_used": (
            lowest_usage.fuel_used
            if lowest_usage
            else 0
        ),
    }


@router.get("/driver-performance")
def driver_performance(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    data = (
        db.query(
            Driver.id,
            User.full_name,
            func.count(Trip.id).label("total_trips"),
        )
        .outerjoin(User, User.id == Driver.user_id)
        .outerjoin(Trip, Trip.driver_id == Driver.id)
        .group_by(Driver.id, User.full_name)
        .all()
    )

    return [
        {
            "driver_id": row.id,
            "driver_name": row.full_name,
            "total_trips": row.total_trips,
        }
        for row in data
    ]


@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    total = db.query(MaintenanceRecord).count()

    completed = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.status == "completed")
        .count()
    )

    pending = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.status == "scheduled")
        .count()
    )

    total_cost = (
        db.query(func.sum(MaintenanceRecord.cost))
        .scalar()
        or 0
    )

    return {
        "total_records": total,
        "completed": completed,
        "pending": pending,
        "total_cost": total_cost,
    }


@router.get("/operations")
def operational_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    total_deliveries = db.query(Shipment).count()

    successful_deliveries = (
        db.query(Shipment)
        .filter(Shipment.status == "delivered")
        .count()
    )

    cancelled_deliveries = (
        db.query(Shipment)
        .filter(Shipment.status == "cancelled")
        .count()
    )

    average_trip_distance = (
        db.query(func.avg(Route.distance_km))
        .scalar()
        or 0
    )

    average_delivery_time = (
        db.query(func.avg(Route.estimated_duration_hours))
        .scalar()
        or 0
    )

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance": round(
            average_trip_distance,
            2,
        ),
        "average_delivery_time": round(
            average_delivery_time,
            2,
        ),
    }