import enum


class AccountRole(str, enum.Enum):
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    DRIVER = "driver"


class VehicleStatus(str, enum.Enum):
    ACTIVE = "active"
    IN_SHOP = "in_shop"
    RETIRED = "retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"


class ShipmentStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class MaintenanceType(str, enum.Enum):
    ROUTINE_SERVICE = "routine_service"
    REPAIR = "repair"
    INSPECTION = "inspection"
    TIRE_CHANGE = "tire_change"
    OTHER = "other"


class NotificationCategory(str, enum.Enum):
    SHIPMENT = "shipment"
    MAINTENANCE = "maintenance"
    SYSTEM = "system"
