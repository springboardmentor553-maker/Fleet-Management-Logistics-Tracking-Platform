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