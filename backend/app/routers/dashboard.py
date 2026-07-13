from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.vehicle import Vehicle
from backend.app.models.driver import Driver
from backend.app.models.shipment import Shipment
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    total_vehicles = db.query(Vehicle).count()
    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()
    on_trip_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    total_drivers = db.query(Driver).count()
    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()
    on_trip_drivers = db.query(Driver).filter(
        Driver.status == "On Trip"
    ).count()

    total_shipments = db.query(Shipment).count()
    pending_shipments = db.query(Shipment).filter(
        Shipment.status == "Pending"
    ).count()
    in_transit_shipments = db.query(Shipment).filter(
        Shipment.status == "In Transit"
    ).count()

    return {
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_on_trip": on_trip_vehicles,

        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "drivers_on_trip": on_trip_drivers,

        "total_shipments": total_shipments,
        "pending_shipments": pending_shipments,
        "in_transit_shipments": in_transit_shipments
    }