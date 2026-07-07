from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard():
    db = SessionLocal()

    total_drivers = db.query(Driver).count()
    total_vehicles = db.query(Vehicle).count()
    total_shipments = db.query(Shipment).count()

    delivered_shipments = db.query(Shipment).filter(
        Shipment.status == "Delivered"
    ).count()

    pending_shipments = db.query(Shipment).filter(
        Shipment.status == "Pending"
    ).count()

    low_fuel_vehicles = db.query(Vehicle).filter(
        Vehicle.fuel_level < 20
    ).count()

    db.close()

    return {
        "total_drivers": total_drivers,
        "total_vehicles": total_vehicles,
        "total_shipments": total_shipments,
        "delivered_shipments": delivered_shipments,
        "pending_shipments": pending_shipments,
        "low_fuel_vehicles": low_fuel_vehicles
    }