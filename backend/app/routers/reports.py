from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
from app.dependencies import fleet_manager_required

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


# Driver Report
@router.get("/drivers")
def driver_report(
    db: Session = Depends(get_db),
    user=Depends(fleet_manager_required)
):
    drivers = db.query(Driver).all()

    return {
        "total_drivers": len(drivers),
        "drivers": [
            {
                "driver_id": d.driver_id,
                "name": d.name,
                "phone": d.phone,
                "license_number": d.license_number
            }
            for d in drivers
        ]
    }


# Vehicle Report
@router.get("/vehicles")
def vehicle_report(
    db: Session = Depends(get_db),
    user=Depends(fleet_manager_required)
):
    vehicles = db.query(Vehicle).all()

    return {
        "total_vehicles": len(vehicles),
        "vehicles": [
            {
                "vehicle_id": v.vehicle_id,
                "vehicle_number": v.vehicle_number,
                "vehicle_type": v.vehicle_type,
                "capacity": v.capacity,
                "status": v.status,
                "fuel_type": v.fuel_type,
                "fuel_level": v.fuel_level,
                "fuel_status": v.fuel_status,
                "latitude": v.latitude,
                "longitude": v.longitude
            }
            for v in vehicles
        ]
    }


# Shipment Report
@router.get("/shipments")
def shipment_report(
    db: Session = Depends(get_db),
    user=Depends(fleet_manager_required)
):
    shipments = db.query(Shipment).all()

    delivered = db.query(Shipment).filter(
        Shipment.current_status == "Delivered"
    ).count()

    created = db.query(Shipment).filter(
        Shipment.current_status == "Created"
    ).count()

    assigned = db.query(Shipment).filter(
        Shipment.current_status == "Assigned"
    ).count()

    in_transit = db.query(Shipment).filter(
        Shipment.current_status == "In Transit"
    ).count()

    delayed = db.query(Shipment).filter(
        Shipment.current_status == "Delayed"
    ).count()

    cancelled = db.query(Shipment).filter(
        Shipment.current_status == "Cancelled"
    ).count()

    return {
        "total_shipments": len(shipments),
        "created": created,
        "assigned": assigned,
        "in_transit": in_transit,
        "delayed": delayed,
        "delivered": delivered,
        "cancelled": cancelled,
        "shipments": [
            {
                "shipment_id": s.shipment_id,
                "shipment_type": s.shipment_type,
                "weight": s.weight,
                "tracking_number": s.tracking_number,
                "sender_name": s.sender_name,
                "receiver_name": s.receiver_name,
                "pickup_location": s.pickup_location,
                "delivery_location": s.delivery_location,
                "driver_id": s.driver_id,
                "vehicle_id": s.vehicle_id,
                "eta": s.eta,
                "created_date": s.created_date,
                "current_status": s.current_status
            }
            for s in shipments
        ]
    }