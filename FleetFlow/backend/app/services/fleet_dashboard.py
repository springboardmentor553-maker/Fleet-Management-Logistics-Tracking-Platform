from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.shipment import Shipment

from app.enums.trip_status import TripStatus
from app.enums.shipment_status import ShipmentStatus


def get_fleet_dashboard(db: Session):

    total_vehicles = (
        db.query(Vehicle)
        .count()
    )

    active_vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.is_active == True
        )
        .count()
    )

    vehicles_under_maintenance = (
        db.query(Vehicle)
        .filter(
            Vehicle.current_status == "Under Maintenance"
        )
        .count()
    )

    total_drivers = (
        db.query(Driver)
        .count()
    )

    available_drivers = (
        db.query(Driver)
        .filter(
            Driver.status == "Available"
        )
        .count()
    )

    assigned_drivers = (
        db.query(Driver)
        .filter(
            Driver.status == "Assigned"
        )
        .count()
    )

    total_trips = (
        db.query(Trip)
        .count()
    )

    completed_trips = (
        db.query(Trip)
        .filter(
            Trip.trip_status == TripStatus.COMPLETED.value
        )
        .count()
    )

    active_shipments = (
        db.query(Shipment)
        .filter(
            Shipment.current_status.notin_([
                ShipmentStatus.DELIVERED.value,
                ShipmentStatus.CANCELLED.value
            ])
        )
        .count()
    )

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "assigned_drivers": assigned_drivers,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_shipments": active_shipments
    }