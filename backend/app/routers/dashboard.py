from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
from app.dependencies import administrator_required

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
def get_dashboard(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
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
        Vehicle.fuel_status == "Low"
    ).count()

    return {
        "total_drivers": total_drivers,
        "total_vehicles": total_vehicles,
        "total_shipments": total_shipments,
        "delivered_shipments": delivered_shipments,
        "pending_shipments": pending_shipments,
        "low_fuel_vehicles": low_fuel_vehicles
    }