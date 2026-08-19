<<<<<<< HEAD
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models import (
    Driver,
    Vehicle,
    Shipment,
    Maintenance
)

from app.dependencies import reports_required

=======
from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


<<<<<<< HEAD
# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# DRIVER REPORT
# =========================================================

@router.get("/drivers")
def driver_report(
    db: Session = Depends(get_db),
    user=Depends(reports_required)
):
=======
@router.get("/drivers")
def driver_report():
    db = SessionLocal()

>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    drivers = db.query(Driver).all()

    return {
        "total_drivers": len(drivers),
<<<<<<< HEAD

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


# =========================================================
# VEHICLE REPORT
# =========================================================

@router.get("/vehicles")
def vehicle_report(
    db: Session = Depends(get_db),
    user=Depends(reports_required)
):
=======
        "drivers": drivers
    }


@router.get("/vehicles")
def vehicle_report():
    db = SessionLocal()

>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    vehicles = db.query(Vehicle).all()

    return {
        "total_vehicles": len(vehicles),
<<<<<<< HEAD

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


# =========================================================
# SHIPMENT REPORT
# =========================================================

@router.get("/shipments")
def shipment_report(
    db: Session = Depends(get_db),
    user=Depends(reports_required)
):
    shipments = db.query(Shipment).all()

    delivered = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "Delivered"
    ).count()

    created = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "Created"
    ).count()

    assigned = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "Assigned"
    ).count()

    in_transit = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "In Transit"
    ).count()

    delayed = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "Delayed"
    ).count()

    cancelled = db.query(
        Shipment
    ).filter(
        Shipment.current_status == "Cancelled"
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    ).count()

    return {
        "total_shipments": len(shipments),
<<<<<<< HEAD

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


# =========================================================
# MAINTENANCE REPORT
# =========================================================

@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db),
    user=Depends(reports_required)
):

    total_records = db.query(
        Maintenance
    ).count()

    vehicles_under_maintenance = db.query(
        Maintenance
    ).filter(
        Maintenance.maintenance_status == "Under Maintenance"
    ).count()

    completed_services = db.query(
        Maintenance
    ).filter(
        Maintenance.maintenance_status == "Completed"
    ).count()

    overdue_services = db.query(
        Maintenance
    ).filter(
        Maintenance.next_service_date < func.now()
    ).count()

    total_maintenance_cost = db.query(
        func.coalesce(
            func.sum(Maintenance.service_cost),
            0
        )
    ).scalar()

    category = (
        db.query(
            Maintenance.maintenance_category,
            func.count(
                Maintenance.maintenance_category
            ).label("count")
        )
        .group_by(
            Maintenance.maintenance_category
        )
        .order_by(
            func.count(
                Maintenance.maintenance_category
            ).desc()
        )
        .first()
    )

    return {
        "total_maintenance_records": total_records,

        "vehicles_under_maintenance":
            vehicles_under_maintenance,

        "completed_services":
            completed_services,

        "overdue_services":
            overdue_services,

        "total_maintenance_cost":
            total_maintenance_cost,

        "most_frequent_maintenance_category":
            category[0].value if category else None
=======
        "delivered": delivered,
        "pending": pending,
        "shipments": shipments
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    }