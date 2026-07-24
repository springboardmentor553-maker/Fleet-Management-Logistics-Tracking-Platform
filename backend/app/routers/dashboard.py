from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
from app.dependencies import administrator_required
from app.enums import ShipmentStatus
from sqlalchemy import or_

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
    # Total Counts
    total_drivers = db.query(Driver).count()
    total_vehicles = db.query(Vehicle).count()
    total_shipments = db.query(Shipment).count()

    # Shipment Status Counts
    created_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.CREATED
    ).count()

    assigned_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.ASSIGNED
    ).count()

    picked_up_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.PICKED_UP
    ).count()

    in_transit_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.IN_TRANSIT
    ).count()

    out_for_delivery_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.OUT_FOR_DELIVERY
    ).count()

    delivered_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELIVERED
    ).count()

    delayed_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELAYED
    ).count()

    cancelled_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.CANCELLED
    ).count()

    # Active Deliveries
    active_deliveries = db.query(Shipment).filter(
        Shipment.current_status.in_([
            ShipmentStatus.ASSIGNED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY
        ])
    ).count()

    # Vehicle Status
    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    on_trip_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    inactive_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    # Fuel Alerts
    low_fuel_vehicles = db.query(Vehicle).filter(
        Vehicle.fuel_status == "Low"
    ).count()

    return {
        "total_drivers": total_drivers,
        "total_vehicles": total_vehicles,
        "total_shipments": total_shipments,

        "active_deliveries": active_deliveries,

        "created_shipments": created_shipments,
        "assigned_shipments": assigned_shipments,
        "picked_up_shipments": picked_up_shipments,
        "in_transit_shipments": in_transit_shipments,
        "out_for_delivery_shipments": out_for_delivery_shipments,
        "delivered_shipments": delivered_shipments,
        "delayed_shipments": delayed_shipments,
        "cancelled_shipments": cancelled_shipments,

        "available_vehicles": available_vehicles,
        "on_trip_vehicles": on_trip_vehicles,
        "maintenance_vehicles": maintenance_vehicles,
        "inactive_vehicles": inactive_vehicles,

        "low_fuel_vehicles": low_fuel_vehicles
    }