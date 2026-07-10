from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment

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
    return {
        "total_drivers": db.query(Driver).count(),
        "total_vehicles": db.query(Vehicle).count(),
        "total_shipments": db.query(Shipment).count(),
        "available_drivers": db.query(Driver).filter(Driver.status == "Available").count(),
        "available_vehicles": db.query(Vehicle).filter(Vehicle.status == "Available").count(),
    }