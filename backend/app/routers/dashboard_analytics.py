from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.maintenance import Maintenance
from app.models.fuel import Fuel

router = APIRouter(
    prefix="/dashboard",
    tags=["Fleet Dashboard"]
)


@router.get("/")
def fleet_dashboard(db: Session = Depends(get_db)):

    total_trips = db.query(func.count(Trip.id)).scalar() or 0

    completed_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == "Completed"
    ).scalar() or 0

    active_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == "In Progress"
    ).scalar() or 0

    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0

    available_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == "Available"
    ).scalar() or 0

    total_drivers = db.query(func.count(Driver.id)).scalar() or 0

    assigned_drivers = db.query(func.count(Driver.id)).filter(
        Driver.status == "Assigned"
    ).scalar() or 0

    maintenance_due = db.query(func.count(Maintenance.id)).filter(
        Maintenance.status == "Scheduled"
    ).scalar() or 0

    total_fuel_cost = db.query(
        func.sum(Fuel.cost)
    ).scalar() or 0

    total_fuel = db.query(
        func.sum(Fuel.liters)
    ).scalar() or 0

    completion_rate = 0

    if total_trips > 0:
        completion_rate = round(
            (completed_trips / total_trips) * 100,
            2
        )

    return {
        "trip_summary": {
            "total_trips": total_trips,
            "completed_trips": completed_trips,
            "active_trips": active_trips,
            "completion_rate": f"{completion_rate}%"
        },

        "vehicle_summary": {
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles
        },

        "driver_summary": {
            "total_drivers": total_drivers,
            "assigned_drivers": assigned_drivers
        },

        "maintenance_summary": {
            "maintenance_due": maintenance_due
        },

        "fuel_summary": {
            "total_liters": total_fuel,
            "total_cost": total_fuel_cost
        }
    }