from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.schemas.dashboard import (
    DashboardStats,
    AdminDashboardStats,
    FleetManagerDashboardStats,
    DispatcherDashboardStats,
    DriverDashboardStats,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return DashboardStats(
        total_vehicles=db.query(Vehicle).count(),
        available_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "available").count(),
        in_transit_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "in_transit").count(),
        total_drivers=db.query(Driver).count(),
        active_drivers=db.query(Driver).filter(Driver.is_available == False).count(),
        total_shipments=db.query(Shipment).count(),
        pending_shipments=db.query(Shipment).filter(Shipment.status == "pending").count(),
        in_transit_shipments=db.query(Shipment).filter(Shipment.status == "in_transit").count(),
        delivered_shipments=db.query(Shipment).filter(Shipment.status == "delivered").count(),
        cancelled_shipments=db.query(Shipment).filter(Shipment.status == "cancelled").count(),
    )


@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN)),
):
    return AdminDashboardStats(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),
        admin_count=db.query(User).filter(User.role == "admin").count(),
        fleet_manager_count=db.query(User).filter(User.role == "fleet_manager").count(),
        dispatcher_count=db.query(User).filter(User.role == "dispatcher").count(),
        driver_count=db.query(User).filter(User.role == "driver").count(),
        total_vehicles=db.query(Vehicle).count(),
        total_drivers=db.query(Driver).count(),
        total_shipments=db.query(Shipment).count(),
        delivered_shipments=db.query(Shipment).filter(Shipment.status == "delivered").count(),
    )


@router.get("/fleet-manager", response_model=FleetManagerDashboardStats)
def get_fleet_manager_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.FLEET_MANAGER, Role.ADMIN)),
):
    return FleetManagerDashboardStats(
        total_vehicles=db.query(Vehicle).count(),
        available_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "available").count(),
        in_transit_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "in_transit").count(),
        in_maintenance_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "maintenance").count(),
        total_drivers=db.query(Driver).count(),
        available_drivers=db.query(Driver).filter(Driver.is_available == True).count(),
        on_trip_drivers=db.query(Driver).filter(Driver.is_available == False).count(),
    )


@router.get("/dispatcher", response_model=DispatcherDashboardStats)
def get_dispatcher_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.DISPATCHER, Role.ADMIN)),
):
    return DispatcherDashboardStats(
        total_shipments=db.query(Shipment).count(),
        pending_shipments=db.query(Shipment).filter(Shipment.status == "pending").count(),
        in_transit_shipments=db.query(Shipment).filter(Shipment.status == "in_transit").count(),
        delivered_shipments=db.query(Shipment).filter(Shipment.status == "delivered").count(),
        cancelled_shipments=db.query(Shipment).filter(Shipment.status == "cancelled").count(),
        available_drivers=db.query(Driver).filter(Driver.is_available == True).count(),
        available_vehicles=db.query(Vehicle).filter(Vehicle.current_status == "available").count(),
    )


@router.get("/driver", response_model=DriverDashboardStats)
def get_driver_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DRIVER, Role.ADMIN)),
):
    driver = db.query(Driver).filter(Driver.email == current_user.email).first()
    if not driver:
        return DriverDashboardStats(
            driver_name=current_user.name,
            driver_email=current_user.email,
            assigned_shipments=0,
            pending_deliveries=0,
            completed_deliveries=0,
            active_trip_id=None,
            vehicle_license_plate=None,
        )

    assigned_count = db.query(Shipment).filter(Shipment.driver_id == driver.id).count()
    pending_count = db.query(Shipment).filter(
        Shipment.driver_id == driver.id,
        Shipment.status == "in_transit"
    ).count()
    completed_count = db.query(Shipment).filter(
        Shipment.driver_id == driver.id,
        Shipment.status == "delivered"
    ).count()

    active_trip = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.status.in_(["scheduled", "started"])
    ).first()

    plate = None
    if active_trip and active_trip.vehicle:
        plate = active_trip.vehicle.license_plate if hasattr(active_trip.vehicle, "license_plate") else getattr(active_trip.vehicle, "plate_number", None)

    return DriverDashboardStats(
        driver_name=driver.name,
        driver_email=driver.email,
        assigned_shipments=assigned_count,
        pending_deliveries=pending_count,
        completed_deliveries=completed_count,
        active_trip_id=active_trip.id if active_trip else None,
        vehicle_license_plate=plate,
    )

