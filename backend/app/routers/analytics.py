from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/analytics", tags=["Analytics"])

DUE_SOON_WINDOW_DAYS = 7


def _pct(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


@router.get("/operational")
def get_operational_analytics(db: Session = Depends(get_db)):
    # ---- Fleet ----
    vehicles = db.query(models.Vehicle).all()
    total_vehicles = len(vehicles)
    available_count = sum(1 for v in vehicles if v.status == "available")
    in_use_count = sum(1 for v in vehicles if v.status == "in_use")
    maintenance_count = sum(1 for v in vehicles if v.status == "maintenance")

    fleet = {
        "total_vehicles": total_vehicles,
        "available": available_count,
        "in_use": in_use_count,
        "maintenance": maintenance_count,
        "utilization_percent": _pct(in_use_count, total_vehicles),
    }

    # ---- Shipments ----
    shipments = db.query(models.Shipment).all()
    total_shipments = len(shipments)

    def shipment_status(s):
        return s.status.value if hasattr(s.status, "value") else s.status

    created_count = sum(1 for s in shipments if shipment_status(s) == "created")
    assigned_count = sum(1 for s in shipments if shipment_status(s) == "assigned")
    picked_up_count = sum(1 for s in shipments if shipment_status(s) == "picked_up")
    in_transit_count = sum(1 for s in shipments if shipment_status(s) == "in_transit")
    out_for_delivery_count = sum(1 for s in shipments if shipment_status(s) == "out_for_delivery")
    delayed_count = sum(1 for s in shipments if shipment_status(s) == "delayed")
    delivered_count = sum(1 for s in shipments if shipment_status(s) == "delivered")
    cancelled_shipments = sum(1 for s in shipments if shipment_status(s) == "cancelled")
    non_cancelled = total_shipments - cancelled_shipments

    shipments_stats = {
        "total": total_shipments,
        "created": created_count,
        "assigned": assigned_count,
        "picked_up": picked_up_count,
        "in_transit": in_transit_count,
        "out_for_delivery": out_for_delivery_count,
        "delayed": delayed_count,
        "delivered": delivered_count,
        "cancelled": cancelled_shipments,
        "success_rate": _pct(delivered_count, non_cancelled),
    }

    # ---- Trips ----
    trips = db.query(models.Trip).all()
    total_trips = len(trips)
    completed_trips = sum(1 for t in trips if t.status == "completed")
    ongoing_trips = sum(1 for t in trips if t.status == "ongoing")
    scheduled_trips = sum(1 for t in trips if t.status == "scheduled")
    cancelled_trips = sum(1 for t in trips if t.status == "cancelled")
    non_cancelled_trips = total_trips - cancelled_trips

    trips_stats = {
        "total": total_trips,
        "completed": completed_trips,
        "ongoing": ongoing_trips,
        "scheduled": scheduled_trips,
        "cancelled": cancelled_trips,
        "completion_rate": _pct(completed_trips, non_cancelled_trips),
    }

    # ---- Drivers ----
    drivers = db.query(models.Driver).all()
    total_drivers = len(drivers)
    active_drivers = sum(1 for d in drivers if d.status == "active")
    inactive_drivers = sum(1 for d in drivers if d.status == "inactive")
    assigned_drivers = sum(1 for d in drivers if d.status == "assigned")

    drivers_stats = {
        "total": total_drivers,
        "active": active_drivers,
        "inactive": inactive_drivers,
        "assigned": assigned_drivers,
    }

    # ---- Maintenance ----
    maintenance_records = db.query(models.Maintenance).all()
    today = datetime.utcnow().date()
    due_soon_cutoff = today + timedelta(days=DUE_SOON_WINDOW_DAYS)

    def maint_status(m):
        return m.status.value if hasattr(m.status, "value") else m.status

    total_maintenance = len(maintenance_records)
    completed_maintenance = sum(1 for m in maintenance_records if maint_status(m) == "completed")
    total_cost = sum(m.service_cost or 0 for m in maintenance_records)

    overdue_count = 0
    due_soon_count = 0
    for m in maintenance_records:
        if maint_status(m) in ("completed", "cancelled") or not m.next_service_date:
            continue
        next_date = m.next_service_date.date() if hasattr(m.next_service_date, "date") else m.next_service_date
        if next_date < today:
            overdue_count += 1
        elif next_date <= due_soon_cutoff:
            due_soon_count += 1

    maintenance_stats = {
        "total_records": total_maintenance,
        "completed": completed_maintenance,
        "overdue": overdue_count,
        "due_soon": due_soon_count,
        "total_cost": round(total_cost, 2),
    }

    return {
        "fleet": fleet,
        "shipments": shipments_stats,
        "trips": trips_stats,
        "drivers": drivers_stats,
        "maintenance": maintenance_stats,
    }


def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


@router.get("/fuel")
def get_fuel_analytics(db: Session = Depends(get_db)):
    """
    Task 3 — Fuel Analytics API.
    GET /analytics/fuel
    """
    records = db.query(models.FuelRecord).all()

    total_records = len(records)
    total_fuel_consumed = sum(r.fuel_quantity for r in records)
    total_fuel_cost = sum(r.fuel_cost for r in records)
    average_fuel_consumption = round(total_fuel_consumed / total_records, 2) if total_records else 0.0

    # Group fuel usage by vehicle
    usage_by_vehicle = {}
    for r in records:
        usage_by_vehicle[r.vehicle_id] = usage_by_vehicle.get(r.vehicle_id, 0) + r.fuel_quantity

    highest_vehicle = None
    lowest_vehicle = None
    if usage_by_vehicle:
        highest_id = max(usage_by_vehicle, key=usage_by_vehicle.get)
        lowest_id = min(usage_by_vehicle, key=usage_by_vehicle.get)

        highest_v = db.query(models.Vehicle).filter(models.Vehicle.id == highest_id).first()
        lowest_v = db.query(models.Vehicle).filter(models.Vehicle.id == lowest_id).first()

        highest_vehicle = {
            "vehicle_id": highest_id,
            "registration_number": highest_v.registration_number if highest_v else None,
            "total_fuel_liters": round(usage_by_vehicle[highest_id], 2),
        }
        lowest_vehicle = {
            "vehicle_id": lowest_id,
            "registration_number": lowest_v.registration_number if lowest_v else None,
            "total_fuel_liters": round(usage_by_vehicle[lowest_id], 2),
        }

    return {
        "total_fuel_consumed_liters": round(total_fuel_consumed, 2),
        "total_fuel_cost": round(total_fuel_cost, 2),
        "average_fuel_consumption_liters": average_fuel_consumption,
        "vehicle_with_highest_fuel_usage": highest_vehicle,
        "vehicle_with_lowest_fuel_usage": lowest_vehicle,
    }


@router.get("/operations")
def get_operations_analytics(db: Session = Depends(get_db)):
    """
    Task 5 — Operational Analytics API.
    GET /analytics/operations
    """
    shipments = db.query(models.Shipment).all()

    def shipment_status(s):
        return s.status.value if hasattr(s.status, "value") else s.status

    total_deliveries = len(shipments)
    successful_deliveries = sum(1 for s in shipments if shipment_status(s) == "delivered")
    delayed_deliveries = sum(1 for s in shipments if shipment_status(s) == "delayed")
    cancelled_deliveries = sum(1 for s in shipments if shipment_status(s) == "cancelled")

    # Average trip distance — computed from trips that have both pickup and
    # destination coordinates recorded (populated when /trips/{id}/route has
    # been called at least once for that trip).
    trips = db.query(models.Trip).all()
    distances = []
    for t in trips:
        if t.pickup_lat is not None and t.pickup_lng is not None and t.destination_lat is not None and t.destination_lng is not None:
            distances.append(_haversine_km(t.pickup_lat, t.pickup_lng, t.destination_lat, t.destination_lng))
    average_trip_distance_km = round(sum(distances) / len(distances), 2) if distances else 0.0

    # Average delivery time — from scheduled_start to scheduled_end for
    # completed trips.
    completed_trips = [t for t in trips if t.status == "completed" and t.scheduled_end is not None]
    durations_hours = [
        (t.scheduled_end - t.scheduled_start).total_seconds() / 3600
        for t in completed_trips
    ]
    average_delivery_time_hours = round(sum(durations_hours) / len(durations_hours), 2) if durations_hours else 0.0

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance_km": average_trip_distance_km,
        "average_delivery_time_hours": average_delivery_time_hours,
    }

@router.get("/drivers")
def get_driver_performance_analytics(db: Session = Depends(get_db)):
    """
    Task 4 — Driver Performance Analytics (fleet-wide).
    GET /analytics/drivers
    """
    drivers = db.query(models.Driver).all()
    total_drivers = len(drivers)

    trips = db.query(models.Trip).all()
    completed_by_driver = {}
    for t in trips:
        if t.status == "completed":
            completed_by_driver[t.driver_id] = completed_by_driver.get(t.driver_id, 0) + 1

    drivers_with_completed_trips = len(completed_by_driver)
    total_completed = sum(completed_by_driver.values())
    average_completed_trips_per_driver = (
        round(total_completed / total_drivers, 2) if total_drivers else 0.0
    )

    top_performer = None
    if completed_by_driver:
        top_driver_id = max(completed_by_driver, key=completed_by_driver.get)
        top_driver = db.query(models.Driver).filter(models.Driver.id == top_driver_id).first()
        top_performer = {
            "driver_id": top_driver_id,
            "name": top_driver.name if top_driver else None,
            "completed_trips": completed_by_driver[top_driver_id],
        }

    # Average attendance percentage across drivers who have at least one logged record
    attendance_records = db.query(models.DriverAttendance).all()
    attendance_by_driver = {}
    for a in attendance_records:
        attendance_by_driver.setdefault(a.driver_id, []).append(a.status)

    per_driver_percentages = []
    for driver_id, statuses in attendance_by_driver.items():
        present_count = sum(1 for s in statuses if s == "present")
        per_driver_percentages.append((present_count / len(statuses)) * 100)

    average_attendance_percentage = (
        round(sum(per_driver_percentages) / len(per_driver_percentages), 2)
        if per_driver_percentages else 0.0
    )

    return {
        "total_drivers": total_drivers,
        "drivers_with_completed_trips": drivers_with_completed_trips,
        "average_completed_trips_per_driver": average_completed_trips_per_driver,
        "top_performer": top_performer,
        "average_attendance_percentage": average_attendance_percentage,
    }