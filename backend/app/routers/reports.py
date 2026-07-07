from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/drivers")
def driver_report():
    db = SessionLocal()

    drivers = db.query(Driver).all()

    return {
        "total_drivers": len(drivers),
        "drivers": drivers
    }


@router.get("/vehicles")
def vehicle_report():
    db = SessionLocal()

    vehicles = db.query(Vehicle).all()

    return {
        "total_vehicles": len(vehicles),
        "vehicles": vehicles
    }


@router.get("/shipments")
def shipment_report():
    db = SessionLocal()

    shipments = db.query(Shipment).all()

    delivered = db.query(Shipment).filter(
        Shipment.status == "Delivered"
    ).count()

    pending = db.query(Shipment).filter(
        Shipment.status == "Pending"
    ).count()

    return {
        "total_shipments": len(shipments),
        "delivered": delivered,
        "pending": pending,
        "shipments": shipments
    }