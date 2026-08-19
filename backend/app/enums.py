from enum import Enum

class ShipmentStatus(str, Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    PICKED_UP = "Picked Up"
    IN_TRANSIT = "In Transit"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"
    DELAYED = "Delayed"
    CANCELLED = "Cancelled"


class MaintenanceCategory(str, Enum):
    OIL_CHANGE = "Oil Change"
    TYRE_REPLACEMENT = "Tyre Replacement"
    BRAKE_SERVICE = "Brake Service"
    ENGINE_SERVICE = "Engine Service"
    GENERAL_INSPECTION = "General Inspection"

    
class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"

class AlertStatus(str, Enum):
    PENDING = "Pending"
    SENT = "Sent"
    COMPLETED = "Completed"