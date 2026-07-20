"""Backward-compatibility shim.

All models and enums have been moved to individual files:
  models/enums.py    – RoleEnum, VehicleStatusEnum, ShipmentStatusEnum, TripStatusEnum
  models/user.py     – User
  models/driver.py   – Driver
  models/vehicle.py  – Vehicle
  models/shipment.py – Shipment
  models/trip.py     – Trip

Existing code that does `from app.models.core import ...` continues to work
because this file re-exports everything from the new locations.
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