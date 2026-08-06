from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.shipment import Shipment

from app.schemas.dashboard import FleetDashboardResponse

router = APIRouter()


# -----------------------------------
# Existing Dashboard
# -----------------------------------
@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "fleet manager",
            "dispatcher"
        )
    )
):
    # ------------------------
    # Vehicle Summary
    # ------------------------
    vehicles = db.query(Vehicle).all()

    total = len(vehicles)

    available = sum(
        v.status.lower() == "available"
        for v in vehicles
    )

    maintenance = sum(
        v.status.lower() == "maintenance"
        for v in vehicles
    )

    active = total - maintenance

    # ------------------------
    # Shipment Summary
    # ------------------------
    shipments = db.query(Shipment).all()

    total_shipments = len(shipments)

    active_deliveries = sum(
        s.status.value.lower() == "assigned"
        for s in shipments
    )

    delivered_shipments = sum(
        s.status.value.lower() == "delivered"
        for s in shipments
    )

    delayed_shipments = sum(
        s.status.value.lower() == "delayed"
        for s in shipments
    )

    return {
        "totalVehicles": total,
        "active": active,
        "maintenance": maintenance,
        "available": available,
        "totalShipments": total_shipments,
        "activeDeliveries": active_deliveries,
        "deliveredShipments": delivered_shipments,
        "delayedShipments": delayed_shipments,
    }


# -----------------------------------
# Fleet Performance Dashboard
# -----------------------------------
@router.get(
    "/fleet",
    response_model=FleetDashboardResponse
)
def fleet_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "fleet manager",
            "dispatcher"
        )
    )
):
    vehicles = db.query(Vehicle).all()
    drivers = db.query(Driver).all()
    trips = db.query(Trip).all()
    shipments = db.query(Shipment).all()

    total_vehicles = len(vehicles)

    active_vehicles = sum(
        v.status.lower() != "maintenance"
        for v in vehicles
    )

    vehicles_under_maintenance = sum(
        v.status.lower() == "maintenance"
        for v in vehicles
    )

    total_drivers = len(drivers)

    available_drivers = sum(
        d.status.lower() == "available"
        for d in drivers
    )

    assigned_drivers = sum(
        d.status.lower() == "assigned"
        for d in drivers
    )

    total_trips = len(trips)

    completed_trips = sum(
        t.status.upper() == "COMPLETED"
        for t in trips
    )

    active_shipments = sum(
        s.status.value.lower() != "delivered"
        for s in shipments
    )

    return {
        "totalVehicles": total_vehicles,
        "activeVehicles": active_vehicles,
        "vehiclesUnderMaintenance": vehicles_under_maintenance,
        "totalDrivers": total_drivers,
        "availableDrivers": available_drivers,
        "assignedDrivers": assigned_drivers,
        "totalTrips": total_trips,
        "completedTrips": completed_trips,
        "activeShipments": active_shipments,
    }