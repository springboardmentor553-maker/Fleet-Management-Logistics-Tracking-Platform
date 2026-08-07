from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.maintenance import Maintenance
from app.models.fuel_record import FuelRecord

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def dashboard(db: Session = Depends(get_db)):

    total_vehicles = db.query(Vehicle).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status == "Available").count()
    vehicles_under_maintenance = db.query(Vehicle).filter(Vehicle.status == "Under Maintenance").count()

    total_drivers = db.query(Driver).count()
    assigned_drivers = db.query(Driver).filter(Driver.status == "Assigned").count()

    total_trips = db.query(Trip).count()
    completed_trips = db.query(Trip).filter(Trip.status == "Completed").count()

    fuel_records = db.query(FuelRecord).all()
    total_fuel_consumption = round(sum(r.liters for r in fuel_records), 2)

    total_maintenance_records = db.query(Maintenance).count()

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "total_drivers": total_drivers,
        "assigned_drivers": assigned_drivers,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "total_fuel_consumption_liters": total_fuel_consumption,
        "total_maintenance_records": total_maintenance_records,
    }