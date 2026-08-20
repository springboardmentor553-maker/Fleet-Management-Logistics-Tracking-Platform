from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.driver import Driver
from app.models.maintenance import Maintenance
from app.models.route import Route, RouteStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.vehicle import Vehicle
from app.models.fuel_record import FuelRecord

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):

    total_vehicles = db.query(Vehicle).count()

    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    active_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()

    inactive_vehicles = db.query(Vehicle).filter(
    Vehicle.status == "Inactive"
    ).count()


    total_drivers = db.query(Driver).count()

    active_drivers = db.query(Driver).filter(
    Driver.status.in_(["ASSIGNED", "ON_TRIP"])
).count()

    total_routes = db.query(Route).count()

    total_shipments = db.query(Shipment).count()
    active_deliveries = db.query(Shipment).filter(
    Shipment.status.in_([
        ShipmentStatus.ASSIGNED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY
    ])
).count()


    delivered_shipments = db.query(Shipment).filter(
    Shipment.status == ShipmentStatus.DELIVERED
).count()

    delayed_shipments = db.query(Shipment).filter(
    Shipment.status == ShipmentStatus.DELAYED
    ).count()

    total_deliveries = db.query(Delivery).count()

    delivered = db.query(Delivery).filter(
    Delivery.delivery_status == "Delivered"
).count()

    delivery_success_rate = (
    (delivered / total_deliveries) * 100
    if total_deliveries > 0
    else 0
)



    total_fuel_consumed = (
    db.query(func.sum(FuelRecord.fuel_quantity))
    .scalar() or 0
)
    total_maintenance = db.query(Maintenance).count()
    pending_maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Scheduled"
).count()

    completed_maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Completed"
).count()
    return {
        "vehicles": {
            "total": total_vehicles,
            "available": available_vehicles,
            "active": active_vehicles,
            "maintenance": maintenance_vehicles,
            "inactive": inactive_vehicles
        },
        "drivers": {
            "total": total_drivers,
            "active": active_drivers
        },
        "routes": {
            "total": total_routes
        },
        "shipments": {
            "total": total_shipments,
            "active_deliveries": active_deliveries,
            "delivered": delivered_shipments,
            "delayed": delayed_shipments
        },
        "maintenance": {
            "pending": pending_maintenance,
            "completed": completed_maintenance
            },
        "operational_analytics": {
            "delivery_success": round(delivery_success_rate, 2),
            "fuel_consumption": total_fuel_consumed
        }
        }
@router.get("/vehicle-utilization")
def vehicle_utilization(db: Session = Depends(get_db)):
    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    active = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()

    inactive = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    return {
        "Available": available,
        "Active": active,
        "Maintenance": maintenance,
        "Inactive": inactive,
        "Total": available + active + maintenance + inactive
    }
@router.get("/driver-workload")
def driver_workload(db: Session = Depends(get_db)):
    report = (
        db.query(
            Driver.id,
            Driver.full_name,
            func.count(Shipment.id).label("total_shipments")
        )
        .outerjoin(Shipment, Driver.id == Shipment.driver_id)
        .group_by(Driver.id, Driver.full_name)
        .all()
    )

    return [
        {
            "driver_id": driver.id,
            "driver_name": driver.full_name,
            "total_shipments": driver.total_shipments
        }
        for driver in report
    ]
@router.get("/shipment-performance")
def shipment_performance(db: Session = Depends(get_db)):
    report = (
        db.query(
            Shipment.status,
            func.count(Shipment.id).label("total_shipments")
        )
        .group_by(Shipment.status)
        .all()
    )

    return [
        {
            "status": row.status.value,
            "total_shipments": row.total_shipments
        }
        for row in report
    ]
@router.get("/delivery-success")
def delivery_success(db: Session = Depends(get_db)):
    total_deliveries = db.query(Delivery).count()

    delivered = db.query(Delivery).filter(
        Delivery.delivery_status == "Delivered"
    ).count()

    pending = db.query(Delivery).filter(
        Delivery.delivery_status == "Pending"
    ).count()

    returned = db.query(Delivery).filter(
        Delivery.delivery_status == "Returned"
    ).count()

    success_rate = (
        (delivered / total_deliveries) * 100
        if total_deliveries > 0
        else 0
    )

    return {
        "total_deliveries": total_deliveries,
        "delivered": delivered,
        "pending": pending,
        "returned": returned,
        "success_rate": round(success_rate, 2)
    }
@router.get("/route-analytics")
def route_analytics(db: Session = Depends(get_db)):
    total_routes = db.query(Route).count()

    active = db.query(Route).filter(
        Route.status == RouteStatus.ACTIVE
    ).count()

    inactive = db.query(Route).filter(
        Route.status == RouteStatus.INACTIVE
    ).count()

    closed = db.query(Route).filter(
        Route.status == RouteStatus.CLOSED
    ).count()

    completion_rate = (
        (closed / total_routes) * 100
        if total_routes > 0
        else 0
    )

    return {
        "total_routes": total_routes,
        "active_routes": active,
        "inactive_routes": inactive,
        "closed_routes": closed,
        "completion_rate": round(completion_rate, 2)
    }
@router.get("/monthly-shipments")
def monthly_shipments(db: Session = Depends(get_db)):
    report = (
        db.query(
            extract("year", Shipment.created_at).label("year"),
            extract("month", Shipment.created_at).label("month"),
            func.count(Shipment.id).label("total_shipments")
        )
        .filter(Shipment.created_at.isnot(None))
        .group_by(
            extract("year", Shipment.created_at),
            extract("month", Shipment.created_at)
        )
        .order_by(
            extract("year", Shipment.created_at),
            extract("month", Shipment.created_at)
        )
        .all()
    )

    return [
        {
            "year": int(row.year),
            "month": int(row.month),
            "total_shipments": row.total_shipments
        }
        for row in report
    ]
@router.get("/vehicle-shipment-report")
def vehicle_shipment_report(db: Session = Depends(get_db)):
    report = (
        db.query(
            Vehicle.id,
            Vehicle.vehicle_number,
            func.count(Shipment.id).label("total_shipments")
        )
        .outerjoin(Shipment, Vehicle.id == Shipment.vehicle_id)
        .group_by(Vehicle.id, Vehicle.vehicle_number)
        .order_by(func.count(Shipment.id).desc())
        .all()
    )

    return [
        {
            "vehicle_id": row.id,
            "vehicle_number": row.vehicle_number,
            "total_shipments": row.total_shipments
        }
        for row in report
    ]
@router.get("/driver-performance")
def driver_performance(db: Session = Depends(get_db)):
    report = (
        db.query(
            Driver.id,
            Driver.full_name,
            func.count(Shipment.id).label("total_shipments")
        )
        .outerjoin(Shipment, Driver.id == Shipment.driver_id)
        .group_by(
            Driver.id,
            Driver.full_name
        )
        .order_by(
            func.count(Shipment.id).desc()
        )
        .all()
    )

    return [
        {
            "driver_id": row.id,
            "driver_name": row.full_name,
            "total_shipments": row.total_shipments
        }
        for row in report
    ]
@router.get("/maintenance-analytics")
def maintenance_analytics(db: Session = Depends(get_db)):
    total = db.query(Maintenance).count()

    scheduled = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Scheduled"
    ).count()

    under_maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Under Maintenance"
    ).count()

    completed = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Completed"
    ).count()

    completion_rate = (
        (completed / total) * 100
        if total > 0 else 0
    )

    return {
        "total_maintenance": total,
        "scheduled": scheduled,
        "under_maintenance": under_maintenance,
        "completed": completed,
        "completion_rate": round(completion_rate, 2)
    }
@router.get("/delivery-performance")
def delivery_performance(db: Session = Depends(get_db)):
    total = db.query(Delivery).count()

    pending = db.query(Delivery).filter(
        Delivery.delivery_status  == "Pending"
    ).count()

    delivered = db.query(Delivery).filter(
        Delivery.delivery_status  == "Delivered"
    ).count()

    returned = db.query(Delivery).filter(
        Delivery.delivery_status  == "Returned"
    ).count()

    success_rate = (
        (delivered / total) * 100
        if total > 0 else 0
    )

    return {
        "total_deliveries": total,
        "pending": pending,
        "delivered": delivered,
        "returned": returned,
        "success_rate": round(success_rate, 2)
    }
@router.get("/vehicle-performance")
def vehicle_performance(db: Session = Depends(get_db)):
    total = db.query(Vehicle).count()

    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    active = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()

    inactive = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    return {
        "total_vehicles": total,
        "available": available,
        "active": active,
        "maintenance": maintenance,
        "inactive": inactive,
    }