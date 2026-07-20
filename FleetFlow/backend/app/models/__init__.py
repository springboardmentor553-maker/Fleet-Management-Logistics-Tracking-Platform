"""Models package.

Import order matters for SQLAlchemy relationship resolution:
enums → user → driver → vehicle → shipment → trip

All existing `from app.models.core import ...` imports in routers/schemas/services
continue to work because core.py now re-exports everything from here.
"""

from app.models.enums import (  # noqa: F401
    RoleEnum,
    ShipmentStatusEnum,
    TripStatusEnum,
    VehicleStatusEnum,
)
from app.models.user import User  # noqa: F401
from app.models.driver import Driver  # noqa: F401
from app.models.vehicle import Vehicle  # noqa: F401
from app.models.shipment import Shipment  # noqa: F401
from app.models.trip import Trip  # noqa: F401