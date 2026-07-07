from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
from app.dependencies import administrator_required

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/drivers")
def driver_report(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
    drivers = db.query(Driver).all()

    return {
        "total_drivers": len(drivers),
        "drivers": [
            {
                "id": d.id,
                "name": d.name,
                "phone": d.phone,
                "license_number": d.license_number
            }
            for d in drivers
        ]
    }

@router.get("/vehicles")
def vehicle_report(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
    vehicles = db.query(Vehicle).all()

    return {
        "total_vehicles": len(vehicles),
        "vehicles": [
            {
                "id": v.id,
                "vehicle_number": v.vehicle_number,
                "vehicle_type": v.vehicle_type,
                "capacity": v.capacity,
                "fuel_type": v.fuel_type,
                "fuel_level": v.fuel_level,
                "fuel_status": v.fuel_status
            }
            for v in vehicles
        ]
    }


@router.get("/shipments")
def shipment_report(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
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
        "shipments": [
            {
                "id": s.id,
                "source": s.source,
                "destination": s.destination,
                "shipment_type": s.shipment_type,
                "weight": s.weight,
                "status": s.status,
                "driver_id": s.driver_id,
                "vehicle_id": s.vehicle_id,
                "eta": s.eta
            }
            for s in shipments
        ]
    }