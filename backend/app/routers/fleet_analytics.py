from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import Fuel
from app.models.maintenance import Maintenance

router = APIRouter(
    prefix="/analytics",
    tags=["Fleet Analytics"]
)


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    total_vehicles = db.query(Vehicle).count()

    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    transit_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "In Transit"
    ).count()

    maintenance_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    total_drivers = db.query(Driver).count()

    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()

    assigned_drivers = db.query(Driver).filter(
        Driver.status == "Assigned"
    ).count()

    total_trips = db.query(Trip).count()

    completed_trips = db.query(Trip).filter(
        Trip.status == "Delivered"
    ).count()

    fuel_cost = db.query(
        func.sum(Fuel.cost)
    ).scalar() or 0

    maintenance_cost = db.query(
        func.sum(Maintenance.service_cost)
    ).scalar() or 0

    return {

        "vehicles": {

            "total": total_vehicles,
            "available": available_vehicles,
            "in_transit": transit_vehicles,
            "maintenance": maintenance_vehicles
        },

        "drivers": {

            "total": total_drivers,
            "available": available_drivers,
            "assigned": assigned_drivers
        },

        "trips": {

            "total": total_trips,
            "completed": completed_trips
        },

        "expenses": {

            "fuel_cost": fuel_cost,
            "maintenance_cost": maintenance_cost,
            "total_cost": fuel_cost + maintenance_cost
        }
    }