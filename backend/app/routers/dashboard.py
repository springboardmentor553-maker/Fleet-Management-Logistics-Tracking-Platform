from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.fuel import Fuel
from app.models.maintenance import Maintenance

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(db: Session = Depends(get_db)):

    return {
        "vehicles": db.query(Vehicle).count(),
        "drivers": db.query(Driver).count(),
        "shipments": db.query(Shipment).count(),
        "trips": db.query(Trip).count(),
        "fuel_records": db.query(Fuel).count(),
        "maintenance": db.query(Maintenance).count(),
    }