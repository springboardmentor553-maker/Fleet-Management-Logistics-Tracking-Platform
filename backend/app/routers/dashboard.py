from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/fleet")
def get_fleet_dashboard(db: Session = Depends(get_db)):
    """
    Task 4 (earlier spec) — Fleet Performance Dashboard API.
    GET /dashboard/fleet
    """
    vehicles = db.query(models.Vehicle).all()
    total_vehicles = len(vehicles)
    vehicles_under_maintenance = sum(1 for v in vehicles if v.status == "maintenance")
    active_vehicles = total_vehicles - vehicles_under_maintenance  # available + in_use

    drivers = db.query(models.Driver).all()
    total_drivers = len(drivers)
    available_drivers = sum(1 for d in drivers if d.status == "active")
    assigned_drivers = sum(1 for d in drivers if d.status == "assigned")

    trips = db.query(models.Trip).all()
    total_trips = len(trips)
    completed_trips = sum(1 for t in trips if t.status == "completed")

    shipments = db.query(models.Shipment).all()

    def shipment_status(s):
        return s.status.value if hasattr(s.status, "value") else s.status

    active_shipment_statuses = ("created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delayed")
    active_shipments = sum(1 for s in shipments if shipment_status(s) in active_shipment_statuses)

    # New — Task 3 gap fill
    fuel_records = db.query(models.FuelRecord).all()
    total_fuel_consumed = round(sum(f.fuel_quantity for f in fuel_records), 2)

    total_maintenance_records = db.query(models.Maintenance).count()

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
        "total_fuel_consumed_liters": total_fuel_consumed,
        "total_maintenance_records": total_maintenance_records,
    }