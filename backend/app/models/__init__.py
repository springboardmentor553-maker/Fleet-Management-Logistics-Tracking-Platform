# Models package for database schema/table definitions
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import Maintenance, MaintenanceCategory, MaintenanceStatus
from app.models.driver_assignment import DriverAssignment, AssignmentStatus
from app.models.driver_attendance import DriverAttendance, AttendanceStatus
from app.models.fuel_log import FuelLog
from app.models.fuel_record import FuelRecordModel
from app.models.fuel import FuelRecord
from app.models.maintenance_alert import MaintenanceAlert, AlertStatus

__all__ = [
    "User",
    "UserRole",
    "Driver",
    "DriverStatus",
    "Vehicle",
    "VehicleStatus",
    "Shipment",
    "ShipmentStatus",
    "Trip",
    "TripStatus",
    "Maintenance",
    "MaintenanceCategory",
    "MaintenanceStatus",
    "FuelLog",
    "DriverAssignment",
    "AssignmentStatus",
    "DriverAttendance",
    "AttendanceStatus",
    "FuelRecord",
    "MaintenanceAlert",
    "AlertStatus",
]
