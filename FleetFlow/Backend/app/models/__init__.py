from app.models.user import User
from app.models.driver import Driver
from app.models.driver_extended import DriverAttendance, DriverActivityLog
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.notification import Notification
from app.models.driver_assignment import DriverAssignment
from app.models.fuel import FuelRecord

__all__ = [
    "User",
    "Driver",
    "DriverAttendance",
    "DriverActivityLog",
    "Vehicle",
    "Shipment",
    "Trip",
    "MaintenanceRecord",
    "MaintenanceAlert",
    "Notification",
    "DriverAssignment",
    "FuelRecord",
]
