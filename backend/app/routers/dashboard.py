from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import Maintenance
from app.utils.dependencies import require_manager, require_dispatcher
from pydantic import BaseModel
from typing import Dict, Any
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

class DashboardSummaryResponse(BaseModel):
    totalVehicles: int
    active: int
    maintenance: int
    available: int
    onTrip: int
    inactive: int
    
    totalShipments: int
    deliveredShipments: int
    delayedShipments: int
    activeDeliveries: int
    
    totalDrivers: int
    assignedDrivers: int
    availableDrivers: int
    driversOnLeave: int
    presentToday: int
    absentToday: int


@router.get("", response_model=DashboardSummaryResponse, dependencies=[Depends(require_manager)])
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Retrieve live vehicle metrics dynamically for the Fleet Summary Dashboard.
    - Admin & Fleet Managers only.
    """
    total_vehicles = db.query(Vehicle).count()
    active = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
    maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
    inactive = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.INACTIVE).count()

    # Vehicles on trip: active vehicles that are currently assigned to shipments in ASSIGNED or IN_TRANSIT status
    on_trip = db.query(Vehicle.id).join(
        Shipment, Shipment.assigned_vehicle_id == Vehicle.id
    ).filter(
        Vehicle.status == VehicleStatus.ACTIVE,
        Shipment.current_status.in_([
            ShipmentStatus.ASSIGNED, 
            ShipmentStatus.PICKED_UP, 
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY
        ])
    ).distinct().count()

    # Available vehicles: active vehicles that are not currently on any active trip
    available = active - on_trip

    total_shipments = db.query(Shipment).count()
    delivered_shipments = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
    delayed_shipments = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()
    
    # Calculate active deliveries
    active_deliveries = db.query(Shipment).filter(
        Shipment.current_status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY])
    ).count()

    from app.models.driver import DriverStatus
    from app.models.driver_attendance import DriverAttendance, AttendanceStatus
    from datetime import date
    
    total_drivers = db.query(Driver).count()
    assigned_drivers = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
    available_drivers = db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
    
    today = date.today()
    present_today = db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.PRESENT).count()
    absent_today = db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.ABSENT).count()
    drivers_on_leave = db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.LEAVE).count()


    return {
        "totalVehicles": total_vehicles,
        "active": active,
        "maintenance": maintenance,
        "available": available,
        "onTrip": on_trip,
        "inactive": inactive,
        "totalShipments": total_shipments,
        "deliveredShipments": delivered_shipments,
        "delayedShipments": delayed_shipments,
        "activeDeliveries": active_deliveries,
        "totalDrivers": total_drivers,
        "assignedDrivers": assigned_drivers,
        "availableDrivers": available_drivers,
        "driversOnLeave": drivers_on_leave,
        "presentToday": present_today,
        "absentToday": absent_today
    }

@router.get("/activities", dependencies=[Depends(require_manager)])
def get_recent_activities(db: Session = Depends(get_db)):
    """
    Retrieve the 10 most recent activities across the platform.
    """
    activities = []
    
    # 1. Recent Vehicles
    recent_vehicles = db.query(Vehicle).order_by(Vehicle.created_at.desc()).limit(10).all()
    for v in recent_vehicles:
        activities.append({
            "type": "Vehicle Registration",
            "description": f"New vehicle registered: {v.make} {v.model} ({v.license_plate})",
            "timestamp": v.created_at.isoformat() if v.created_at else None,
            "id": f"v-{v.id}"
        })
        
    # 2. Recent Drivers
    recent_drivers = db.query(Driver).options(joinedload(Driver.user)).order_by(Driver.created_at.desc()).limit(10).all()
    for d in recent_drivers:
        name = d.user.full_name if d.user else "Unknown"
        activities.append({
            "type": "Driver Registration",
            "description": f"New driver registered: {name} (License: {d.license_number})",
            "timestamp": d.created_at.isoformat() if d.created_at else None,
            "id": f"d-{d.id}"
        })
        
    # 3. Recent Shipments
    recent_shipments = db.query(Shipment).order_by(Shipment.created_at.desc()).limit(10).all()
    for s in recent_shipments:
        activities.append({
            "type": "Shipment Creation",
            "description": f"Shipment {s.tracking_number} created from {s.pickup_location} to {s.delivery_location}",
            "timestamp": s.created_at.isoformat() if s.created_at else None,
            "id": f"s-{s.id}"
        })
        
    # 4. Recent Trips (Assignment, Started, Completed)
    recent_trips = db.query(Trip).options(joinedload(Trip.vehicle)).order_by(Trip.updated_at.desc()).limit(20).all()
    from app.models.trip import TripStatus
    for t in recent_trips:
        vehicle_plate = t.vehicle.license_plate if t.vehicle else "Unassigned"
        
        # We deduce activity based on current status and updated_at
        if t.trip_status == TripStatus.COMPLETED:
            activities.append({
                "type": "Trip Completed",
                "description": f"Trip #{t.id} completed by vehicle {vehicle_plate}",
                "timestamp": t.updated_at.isoformat() if t.updated_at else None,
                "id": f"t-{t.id}-completed"
            })
        elif t.trip_status == TripStatus.IN_TRANSIT:
            activities.append({
                "type": "Trip Started",
                "description": f"Trip #{t.id} started by vehicle {vehicle_plate}",
                "timestamp": t.updated_at.isoformat() if t.updated_at else None,
                "id": f"t-{t.id}-started"
            })
        elif t.trip_status == TripStatus.CREATED and t.driver_id:
            activities.append({
                "type": "Trip Assignment",
                "description": f"Trip #{t.id} assigned to vehicle {vehicle_plate}",
                "timestamp": t.updated_at.isoformat() if t.updated_at else None,
                "id": f"t-{t.id}-assigned"
            })
        
    # 5. Recent Maintenance
    recent_maintenance = db.query(Maintenance).options(joinedload(Maintenance.vehicle)).order_by(Maintenance.created_at.desc()).limit(10).all()
    for m in recent_maintenance:
        vehicle_plate = m.vehicle.license_plate if m.vehicle else "Unknown"
        # Format the enum string if necessary (Task 8 compliance)
        cat_str = m.maintenance_category.value.replace('_', ' ').title() if hasattr(m.maintenance_category, 'value') else str(m.maintenance_category)
        activities.append({
            "type": "Maintenance Log",
            "description": f"Maintenance '{cat_str}' logged for vehicle {vehicle_plate}",
            "timestamp": m.created_at.isoformat() if m.created_at else None,
            "id": f"m-{m.id}"
        })

    # 6. Fuel Records
    from app.models.fuel_record import FuelRecordModel
    recent_fuel = db.query(FuelRecordModel).options(joinedload(FuelRecordModel.vehicle)).order_by(FuelRecordModel.created_at.desc()).limit(10).all()
    for f in recent_fuel:
        vehicle_plate = f.vehicle.license_plate if f.vehicle else "Unknown"
        activities.append({
            "type": "Fuel Records",
            "description": f"Added {f.fuel_quantity}L fuel for vehicle {vehicle_plate}",
            "timestamp": f.created_at.isoformat() if f.created_at else None,
            "id": f"f-{f.id}"
        })

    # 7. Driver Attendance
    from app.models.driver_attendance import DriverAttendance
    recent_attendance = db.query(DriverAttendance).options(joinedload(DriverAttendance.driver).joinedload(Driver.user)).order_by(DriverAttendance.created_at.desc()).limit(10).all()
    for a in recent_attendance:
        driver_name = a.driver.user.full_name if a.driver and a.driver.user else "Unknown Driver"
        att_str = a.attendance_status.value.title() if hasattr(a.attendance_status, 'value') else str(a.attendance_status)
        activities.append({
            "type": "Attendance",
            "description": f"Attendance marked '{att_str}' for {driver_name}",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "id": f"a-{a.id}"
        })
        
    # Filter out any without timestamps (should not happen, but safe)
    activities = [a for a in activities if a["timestamp"]]
    
    # Sort by timestamp DESC
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Return top 10
    return activities[:10]

@router.get("/fleet", dependencies=[Depends(require_dispatcher)])
def get_fleet_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_vehicles = db.query(Vehicle).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
    vehicles_under_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
    
    from app.models.driver import Driver, DriverStatus
    from app.models.trip import Trip, TripStatus
    
    total_drivers = db.query(Driver).count()
    available_drivers = db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
    assigned_drivers = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
    
    total_trips = db.query(Trip).count()
    completed_trips = db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).count()
    
    active_shipments = db.query(Shipment).filter(
        Shipment.current_status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY])
    ).count()

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "assigned_drivers": assigned_drivers,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_shipments": active_shipments
    }

