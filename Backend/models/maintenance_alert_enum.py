import enum


class AlertStatus(str, enum.Enum):
    PENDING = "Pending"
    SENT = "Sent"
    COMPLETED = "Completed"