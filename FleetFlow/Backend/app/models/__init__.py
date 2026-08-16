from app.models.user import User
from app.models.driver import Driver
from app.models.driver_extended import DriverAttendance
from app.models.driver_extended import DriverActivityLog
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.maintenance import MaintenanceRecord
from app.models.driver_assignment import DriverAssignment
__all__ = [
    "User",
    "Driver",
    "DriverAttendance",
    "DriverActivityLog",
    "Vehicle",
    "Shipment",
    "Trip",
    "MaintenanceRecord",
    "DriverAssignment"
]
