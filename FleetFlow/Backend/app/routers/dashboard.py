from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
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
    FleetPerformanceDashboardStats,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    v_total, v_avail, v_transit = db.query(
        func.count(Vehicle.id),
        func.count(case((Vehicle.current_status == "available", 1))),
        func.count(case((Vehicle.current_status == "in_transit", 1))),
    ).first()

    d_total, d_active = db.query(
        func.count(Driver.id),
        func.count(case((Driver.is_available == False, 1))),
    ).first()

    s_total, s_pending, s_transit, s_delivered, s_cancelled = db.query(
        func.count(Shipment.id),
        func.count(case((Shipment.status == "pending", 1))),
        func.count(case((Shipment.status == "in_transit", 1))),
        func.count(case((Shipment.status == "delivered", 1))),
        func.count(case((Shipment.status == "cancelled", 1))),
    ).first()

    return DashboardStats(
        total_vehicles=v_total or 0,
        available_vehicles=v_avail or 0,
        in_transit_vehicles=v_transit or 0,
        total_drivers=d_total or 0,
        active_drivers=d_active or 0,
        total_shipments=s_total or 0,
        pending_shipments=s_pending or 0,
        in_transit_shipments=s_transit or 0,
        delivered_shipments=s_delivered or 0,
        cancelled_shipments=s_cancelled or 0,
    )


@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN)),
):
    u_total, u_active, u_admin, u_fm, u_disp, u_drv = db.query(
        func.count(User.id),
        func.count(case((User.is_active == True, 1))),
        func.count(case((User.role == "admin", 1))),
        func.count(case((User.role == "fleet_manager", 1))),
        func.count(case((User.role == "dispatcher", 1))),
        func.count(case((User.role == "driver", 1))),
    ).first()
    v_total, = db.query(func.count(Vehicle.id)).first()
    d_total, = db.query(func.count(Driver.id)).first()
    s_total, s_delivered = db.query(
        func.count(Shipment.id),
        func.count(case((Shipment.status == "delivered", 1))),
    ).first()
    return AdminDashboardStats(
        total_users=u_total or 0,
        active_users=u_active or 0,
        admin_count=u_admin or 0,
        fleet_manager_count=u_fm or 0,
        dispatcher_count=u_disp or 0,
        driver_count=u_drv or 0,
        total_vehicles=v_total or 0,
        total_drivers=d_total or 0,
        total_shipments=s_total or 0,
        delivered_shipments=s_delivered or 0,
    )


@router.get("/fleet-manager", response_model=FleetManagerDashboardStats)
def get_fleet_manager_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.FLEET_MANAGER, Role.ADMIN)),
):
    v_total, v_avail, v_transit, v_maint = db.query(
        func.count(Vehicle.id),
        func.count(case((Vehicle.current_status == "available", 1))),
        func.count(case((Vehicle.current_status == "in_transit", 1))),
        func.count(case((Vehicle.current_status == "maintenance", 1))),
    ).first()
    d_total, d_avail, d_trip = db.query(
        func.count(Driver.id),
        func.count(case((Driver.is_available == True, 1))),
        func.count(case((Driver.is_available == False, 1))),
    ).first()
    return FleetManagerDashboardStats(
        total_vehicles=v_total or 0,
        available_vehicles=v_avail or 0,
        in_transit_vehicles=v_transit or 0,
        in_maintenance_vehicles=v_maint or 0,
        total_drivers=d_total or 0,
        available_drivers=d_avail or 0,
        on_trip_drivers=d_trip or 0,
    )


@router.get("/dispatcher", response_model=DispatcherDashboardStats)
def get_dispatcher_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.DISPATCHER, Role.ADMIN)),
):
    s_total, s_pend, s_trans, s_del, s_can = db.query(
        func.count(Shipment.id),
        func.count(case((Shipment.status == "pending", 1))),
        func.count(case((Shipment.status == "in_transit", 1))),
        func.count(case((Shipment.status == "delivered", 1))),
        func.count(case((Shipment.status == "cancelled", 1))),
    ).first()
    d_avail, = db.query(func.count(case((Driver.is_available == True, 1)))).first()
    v_avail, = db.query(func.count(case((Vehicle.current_status == "available", 1)))).first()
    return DispatcherDashboardStats(
        total_shipments=s_total or 0,
        pending_shipments=s_pend or 0,
        in_transit_shipments=s_trans or 0,
        delivered_shipments=s_del or 0,
        cancelled_shipments=s_can or 0,
        available_drivers=d_avail or 0,
        available_vehicles=v_avail or 0,
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


@router.get("/fleet", response_model=FleetPerformanceDashboardStats)
def get_fleet_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total_vehicles = db.query(Vehicle).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.current_status == "in_transit").count()
    vehicles_under_maintenance = db.query(Vehicle).filter(Vehicle.current_status == "maintenance").count()

    total_drivers = db.query(Driver).count()
    available_drivers = db.query(Driver).filter(Driver.is_available == True).count()
    # assigned_drivers: drivers who have an assigned_vehicle_id
    assigned_drivers = db.query(Driver).filter(Driver.assigned_vehicle_id != None).count()

    total_trips = db.query(Trip).count()
    completed_trips = db.query(Trip).filter(Trip.status == "completed").count()
    active_shipments = db.query(Shipment).filter(Shipment.status == "in_transit").count()

    return FleetPerformanceDashboardStats(
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        vehicles_under_maintenance=vehicles_under_maintenance,
        total_drivers=total_drivers,
        available_drivers=available_drivers,
        assigned_drivers=assigned_drivers,
        total_trips=total_trips,
        completed_trips=completed_trips,
        active_shipments=active_shipments,
    )


