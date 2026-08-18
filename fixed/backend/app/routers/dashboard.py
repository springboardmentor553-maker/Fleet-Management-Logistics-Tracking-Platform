from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.analytics import FleetDashboardResponse

router = APIRouter()


@router.get("/fleet", response_model=FleetDashboardResponse)
def get_fleet_dashboard(db: Session = Depends(get_db)):
    """
    Fleet Performance Dashboard API (Task 4 requirement).
    Returns vehicle status counts, driver breakdown, and trip/shipment counts.
    """
    total_vehicles = db.query(models.Vehicle).count()
    vehicles_under_maintenance = db.query(models.Vehicle).filter(
        models.Vehicle.status.ilike("maintenance")
    ).count()
    active_vehicles = total_vehicles - vehicles_under_maintenance

    total_drivers = db.query(models.Driver).count()
    available_drivers = db.query(models.Driver).filter(
        models.Driver.status.ilike("available")
    ).count()
    assigned_drivers = db.query(models.Driver).filter(
        models.Driver.status.ilike("assigned") | models.Driver.status.ilike("on_trip")
    ).count()
    if assigned_drivers == 0 and total_drivers > available_drivers:
        assigned_drivers = total_drivers - available_drivers

    total_trips = db.query(models.Trip).count()
    completed_trips = db.query(models.Trip).filter(
        models.Trip.status == models.TripStatus.COMPLETED
    ).count()

    active_shipments = db.query(models.Shipment).filter(
        models.Shipment.status.in_([
            models.ShipmentStatus.CREATED,
            models.ShipmentStatus.ASSIGNED,
            models.ShipmentStatus.PICKED_UP,
            models.ShipmentStatus.IN_TRANSIT,
            models.ShipmentStatus.OUT_FOR_DELIVERY,
            models.ShipmentStatus.DELAYED,
        ])
    ).count()

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "assigned_drivers": assigned_drivers,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_shipments": active_shipments,
    }


@router.get("/")
@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    """Fleet Summary & Shipment Statistics API (Jul 7 Task 8 & Jul 17 Task 5)."""
    total_vehicles = db.query(models.Vehicle).count()
    available_vehicles = db.query(models.Vehicle).filter(models.Vehicle.status.ilike("available")).count()
    maintenance_vehicles = db.query(models.Vehicle).filter(models.Vehicle.status.ilike("maintenance")).count()
    on_trip_vehicles = db.query(models.Vehicle).filter(models.Vehicle.status.ilike("on_trip")).count()
    active_vehicles = total_vehicles - maintenance_vehicles

    total_shipments = db.query(models.Shipment).count()
    active_deliveries = db.query(models.Shipment).filter(
        models.Shipment.status.in_([models.ShipmentStatus.IN_TRANSIT, models.ShipmentStatus.OUT_FOR_DELIVERY])
    ).count()
    delivered_shipments = db.query(models.Shipment).filter(models.Shipment.status == models.ShipmentStatus.DELIVERED).count()
    delayed_shipments = db.query(models.Shipment).filter(models.Shipment.status == models.ShipmentStatus.DELAYED).count()

    active_maintenance_count = (
        db.query(models.MaintenanceRecord)
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .count()
    )
    fuel_records_count = db.query(models.FuelRecord).count()

    return {
        # General Entity Counts
        "users": db.query(models.User).count(),
        "vehicles": total_vehicles,
        "drivers": db.query(models.Driver).count(),
        "shipments": total_shipments,
        "routes": db.query(models.Route).count(),
        "maintenance_records": active_maintenance_count,
        "fuel_records": fuel_records_count,
        "unread_notifications": db.query(models.Notification)
        .filter(models.Notification.is_read == 0)
        .count(),
        # Fleet Status Breakdown (Jul 7 spec)
        "totalVehicles": total_vehicles,
        "active": active_vehicles,
        "maintenance": maintenance_vehicles,
        "available": available_vehicles,
        "on_trip": on_trip_vehicles,
        # Shipment Statistics (Jul 17 spec)
        "total_shipments": total_shipments,
        "active_deliveries": active_deliveries,
        "delivered_shipments": delivered_shipments,
        "delayed_shipments": delayed_shipments,
    }
