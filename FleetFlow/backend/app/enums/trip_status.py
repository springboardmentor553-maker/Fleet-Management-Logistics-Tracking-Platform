from enum import Enum


class TripStatus(Enum):
    SCHEDULED = "Scheduled"
    STARTED = "Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"