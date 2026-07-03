# Models package for database schema/table definitions
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment, ShipmentStatus

__all__ = [
    "User",
    "UserRole",
    "Driver",
    "DriverStatus",
    "Vehicle",
    "VehicleStatus",
    "Shipment",
    "ShipmentStatus",
]
