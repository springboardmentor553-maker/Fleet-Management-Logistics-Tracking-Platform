# Models package for database schema/table definitions

from app.models.maintenance import MaintenanceRecord
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.route import Route
from app.models.notification import Notification

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
    "Route",
    "Notification",
]