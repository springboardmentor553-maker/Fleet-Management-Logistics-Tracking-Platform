"""All application enums in one place.

Keeping enums separate from model classes avoids circular imports
when models are split into individual files.
"""

import enum


class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    FLEET_MANAGER = "FLEET_MANAGER"
    DRIVER = "DRIVER"
    DISPATCHER = "DISPATCHER"


class VehicleStatusEnum(enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    MAINTENANCE = "MAINTENANCE"


class ShipmentStatusEnum(enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"


class TripStatusEnum(enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
