from enum import Enum


class ShipmentStatus(str, Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    IN_TRANSIT = "In Transit"
    DELAYED = "Delayed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"