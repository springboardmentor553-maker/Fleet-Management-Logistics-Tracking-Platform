from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.shipment import Shipment

from datetime import datetime

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):

    # Vehicle Statistics
    total_vehicles = db.query(Vehicle).count()

    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    on_trip = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    inactive = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    # Shipment Statistics
    total_shipments = db.query(Shipment).count()

    # Trip Statistics
    total_trips = db.query(Trip).count()

    scheduled_trips = db.query(Trip).filter(
        Trip.status == "Scheduled"
    ).count()

    active_trips = db.query(Trip).filter(
        Trip.status == "In Transit"
    ).count()

    completed_trips = db.query(Trip).filter(
        Trip.status == "Delivered"
    ).count()

    # Delayed Trips
    delayed_trips = 0

    trips = db.query(Trip).all()

    for trip in trips:
        if trip.expected_arrival:
            try:
                expected = datetime.strptime(
                    trip.expected_arrival,
                    "%Y-%m-%d %H:%M"
                )

                if expected < datetime.now() and trip.status != "Delivered":
                    delayed_trips += 1

            except Exception:
                pass

    return {
        "vehicles": {
            "total": total_vehicles,
            "available": available,
            "on_trip": on_trip,
            "maintenance": maintenance,
            "inactive": inactive
        },
        "shipments": {
            "total": total_shipments
        },
        "trips": {
            "total": total_trips,
            "scheduled": scheduled_trips,
            "active": active_trips,
            "completed": completed_trips,
            "delayed": delayed_trips
        }
    }