from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas.fleet_dashboard import FleetDashboardResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Fleet Dashboard"]
)


@router.get("/fleet", response_model=FleetDashboardResponse)
def fleet_dashboard(db: Session = Depends(get_db)):

    total_vehicles = db.query(func.count(Vehicle.id)).scalar()

    active_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == "Available"
    ).scalar()

    vehicles_under_maintenance = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == "Maintenance"
    ).scalar()

    total_drivers = db.query(func.count(Driver.id)).scalar()

    available_drivers = db.query(func.count(Driver.id)).filter(
        Driver.status == "AVAILABLE"
    ).scalar()

    assigned_drivers = db.query(func.count(Driver.id)).filter(
        Driver.status == "ASSIGNED"
    ).scalar()

    total_trips = db.query(func.count(Trip.id)).scalar()

    completed_trips = db.query(func.count(Trip.id)).filter(
        Trip.status == "COMPLETED"
    ).scalar()

    active_shipments = db.query(func.count(Shipment.id)).filter(
        Shipment.status.in_([
            "ASSIGNED",
            "IN_TRANSIT",
            "PICKED_UP",
            "OUT_FOR_DELIVERY"
        ])
    ).scalar()

    return FleetDashboardResponse(
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        vehicles_under_maintenance=vehicles_under_maintenance,

        total_drivers=total_drivers,
        available_drivers=available_drivers,
        assigned_drivers=assigned_drivers,

        total_trips=total_trips,
        completed_trips=completed_trips,

        active_shipments=active_shipments
    )