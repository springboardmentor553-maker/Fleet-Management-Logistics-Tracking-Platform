# app/models/__init__.py

from app.models.fuel_record import FuelRecord

from .delivery import Delivery
from .driver import Driver
from .driver_assignment import DriverAssignment
from .driver_attendance import DriverAttendance
from .maintenance import Maintenance
from .maintenance_alert import MaintenanceAlert
from .notification import Notification
from .route import Route
from .shipment import Shipment
from .trip import Trip
from .user import User
from .vehicle import Vehicle
