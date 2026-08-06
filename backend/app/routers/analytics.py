from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import math

from backend.app.database import get_db
from backend.app.models.fuel_record import FuelRecord
from backend.app.models.vehicle import Vehicle
from backend.app.models.shipment import Shipment
from backend.app.models.trip import Trip
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

ALLOWED_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]


@router.get("/fuel")
def get_fuel_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Return aggregated fuel analytics across all fuel records."""

    # ── Totals ────────────────────────────────────────────────────────────────
    totals = db.query(
        func.sum(FuelRecord.fuel_quantity).label("total_fuel_consumed"),
        func.sum(FuelRecord.fuel_cost).label("total_fuel_cost"),
        func.avg(FuelRecord.fuel_quantity).label("average_fuel_consumption"),
    ).one()

    total_fuel_consumed: float = float(totals.total_fuel_consumed or 0)
    total_fuel_cost: float = float(totals.total_fuel_cost or 0)
    average_fuel_consumption: float = float(totals.average_fuel_consumption or 0)

    # ── Per-vehicle consumption ───────────────────────────────────────────────
    vehicle_usage = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label("fuel_consumed"),
        )
        .group_by(FuelRecord.vehicle_id)
        .all()
    )

    vehicle_with_highest_fuel_usage: Optional[dict] = None
    vehicle_with_lowest_fuel_usage: Optional[dict] = None

    if vehicle_usage:
        # Highest
        highest = max(vehicle_usage, key=lambda r: r.fuel_consumed)
        highest_vehicle = db.query(Vehicle).filter(Vehicle.id == highest.vehicle_id).first()
        vehicle_with_highest_fuel_usage = {
            "vehicle_id": highest.vehicle_id,
            "vehicle_number": highest_vehicle.vehicle_number if highest_vehicle else "Unknown",
            "fuel_consumed": float(highest.fuel_consumed),
        }

        # Lowest
        lowest = min(vehicle_usage, key=lambda r: r.fuel_consumed)
        lowest_vehicle = db.query(Vehicle).filter(Vehicle.id == lowest.vehicle_id).first()
        vehicle_with_lowest_fuel_usage = {
            "vehicle_id": lowest.vehicle_id,
            "vehicle_number": lowest_vehicle.vehicle_number if lowest_vehicle else "Unknown",
            "fuel_consumed": float(lowest.fuel_consumed),
        }

    return {
        "total_fuel_consumed": total_fuel_consumed,
        "total_fuel_cost": total_fuel_cost,
        "average_fuel_consumption": average_fuel_consumption,
        "vehicle_with_highest_fuel_usage": vehicle_with_highest_fuel_usage,
        "vehicle_with_lowest_fuel_usage": vehicle_with_lowest_fuel_usage,
    }


# ── Operational Analytics ─────────────────────────────────────────────────────

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    """Return great-circle distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/operations")
def get_operations_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Return operational delivery and trip analytics."""

    # ── Delivery counts (Shipment table) ─────────────────────────────────────
    total_deliveries: int = db.query(Shipment).count()
    successful_deliveries: int = db.query(Shipment).filter(Shipment.status == "Delivered").count()
    delayed_deliveries: int = db.query(Shipment).filter(Shipment.status == "Delayed").count()
    cancelled_deliveries: int = db.query(Shipment).filter(Shipment.status == "Cancelled").count()

    # ── Average delivery time in hours (scheduled_end - scheduled_start) ──────
    trips = db.query(
        Trip.scheduled_start,
        Trip.scheduled_end,
        Trip.pickup_latitude,
        Trip.pickup_longitude,
        Trip.destination_latitude,
        Trip.destination_longitude,
    ).all()

    total_hours = 0.0
    total_distance_km = 0.0
    trip_count_time = 0
    trip_count_dist = 0

    for t in trips:
        if t.scheduled_start and t.scheduled_end:
            delta = (t.scheduled_end - t.scheduled_start).total_seconds() / 3600
            if delta >= 0:
                total_hours += delta
                trip_count_time += 1

        if (
            t.pickup_latitude is not None
            and t.pickup_longitude is not None
            and t.destination_latitude is not None
            and t.destination_longitude is not None
        ):
            total_distance_km += _haversine_km(
                t.pickup_latitude, t.pickup_longitude,
                t.destination_latitude, t.destination_longitude,
            )
            trip_count_dist += 1

    average_delivery_time: float = round(total_hours / trip_count_time, 4) if trip_count_time else 0.0
    average_trip_distance: float = round(total_distance_km / trip_count_dist, 4) if trip_count_dist else 0.0

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance": average_trip_distance,
        "average_delivery_time": average_delivery_time,
    }
