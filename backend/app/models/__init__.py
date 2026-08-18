# Models package for database schema/table definitions

from app.models.maintenance import MaintenanceRecord
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment
from app.models.route import Route
from app.models.notification import Notification
from app.models.trip import Trip
from app.models.audit_log import AuditLog
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.fuel import FuelLog
from app.models.maintenance_alert import MaintenanceAlert

__all__ = [
    "User",
    "UserRole",
    "Driver",
    "DriverStatus",
    "Vehicle",
    "VehicleStatus",
    "Shipment",
    "ShipmentStatus",
    "MaintenanceRecord",
    "Trip",
    "Route",
    "Notification",
    "AuditLog",
    "DriverAssignment",
    "DriverAttendance",
    "FuelLog",
    "MaintenanceAlert",
]