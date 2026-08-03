"""Models package.

Import order matters for SQLAlchemy relationship resolution:
enums → user → driver → vehicle → shipment → trip → maintenance
      → driver_assignment → driver_attendance
"""

from app.models.enums import (  # noqa: F401
    AssignmentStatusEnum,
    AttendanceStatusEnum,
    DriverStatusEnum,
    MaintenanceCategoryEnum,
    MaintenanceStatusEnum,
    RoleEnum,
    ShipmentStatusEnum,
    TripStatusEnum,
    VehicleStatusEnum,
    AlertStatusEnum,
)
from app.models.user import User  # noqa: F401
from app.models.driver import Driver  # noqa: F401
from app.models.vehicle import Vehicle  # noqa: F401
from app.models.shipment import Shipment  # noqa: F401
from app.models.trip import Trip  # noqa: F401
from app.models.maintenance import MaintenanceRecord  # noqa: F401
from app.models.driver_assignment import DriverAssignment  # noqa: F401
from app.models.driver_attendance import DriverAttendance  # noqa: F401
from app.models.fuel_record import FuelRecord  # noqa: F401
from app.models.maintenance_alert import MaintenanceAlert  # noqa: F401