from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session  
from app.database import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.vehicle import Vehicle
from app.models.driver import Driver
router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
    )   
@router.get("/shipments")
def shipment_report(db: Session = Depends(get_db)):
    total = db.query(Shipment).count()
    pending = db.query(Shipment).filter(
        Shipment.status == ShipmentStatus.CREATED
    ).count()
    transit = db.query(Shipment).filter(
        Shipment.status == ShipmentStatus.IN_TRANSIT
    ).count()
    delivered = db.query(Shipment).filter(
        Shipment.status == ShipmentStatus.DELIVERED
    ).count()

    return {
        "total_shipments": total,
        "pending": pending,
        "in_transit": transit,
        "delivered": delivered
    }
@router.get("/vehicles")
def vehicle_report(db: Session = Depends(get_db)):
    total = db.query(Vehicle).count()
    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()
    active = db.query(Vehicle).filter(
        Vehicle.status == "Active"
    ).count()
    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    return {
        "total_vehicles": total,
        "available": available,
        "active": active,
        "maintenance": maintenance
    }
@router.get("/drivers")
def driver_report(db: Session = Depends(get_db)):
    total = db.query(Driver).count()
    active = db.query(Driver).filter(
        Driver.status == "Active"
    ).count()
    inactive = db.query(Driver).filter(
        Driver.status == "Inactive"
    ).count()

    return {
        "total_drivers": total,
        "active": active,
        "inactive": inactive
    }