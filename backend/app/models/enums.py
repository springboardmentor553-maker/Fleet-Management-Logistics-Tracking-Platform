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


class MaintenanceCategoryEnum(enum.Enum):
    OIL_CHANGE          = "OIL_CHANGE"
    TYRE_REPLACEMENT    = "TYRE_REPLACEMENT"
    BRAKE_SERVICE       = "BRAKE_SERVICE"
    ENGINE_SERVICE      = "ENGINE_SERVICE"
    GENERAL_INSPECTION  = "GENERAL_INSPECTION"


class MaintenanceStatusEnum(enum.Enum):
    SCHEDULED   = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED   = "COMPLETED"
    CANCELLED   = "CANCELLED"


class AssignmentStatusEnum(enum.Enum):
    ACTIVE    = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AttendanceStatusEnum(enum.Enum):
    PRESENT = "PRESENT"
    ABSENT  = "ABSENT"
    LEAVE   = "LEAVE"


class DriverStatusEnum(enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_DUTY   = "ON_DUTY"
    OFF_DUTY  = "OFF_DUTY"

class AlertStatusEnum(enum.Enum):
    PENDING = "PENDING"
    SENT    = "SENT"
    COMPLETED = "COMPLETED"

