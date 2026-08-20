import enum


class AlertType(str, enum.Enum):
    UPCOMING_SERVICE = "Upcoming Service"
    OVERDUE_SERVICE = "Overdue Service"
    GENERAL = "General"