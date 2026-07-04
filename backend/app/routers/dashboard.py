from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def dashboard(db: Session = Depends(get_db)):

    total_vehicles = db.query(func.count(Vehicle.id)).scalar()

    available_vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.status == "Available"
    ).scalar()

    total_drivers = db.query(func.count(Driver.id)).scalar()

    total_shipments = db.query(func.count(Shipment.id)).scalar()

    return {
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "total_drivers": total_drivers,
        "total_shipments": total_shipments
    }