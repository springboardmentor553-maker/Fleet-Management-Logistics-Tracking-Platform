from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.maintenance_alert_enum import AlertStatus
from app.models.maintenance_alert_type_enum import AlertType


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    maintenance_id = Column(
        Integer,
        ForeignKey("maintenance.id"),
        nullable=False
    )

    alert_message = Column(
        String(255),
        nullable=False
    )

    alert_type = Column(
        Enum(AlertType, name="alert_type_enum"),
        nullable=False
    )

    alert_status = Column(
        Enum(AlertStatus, name="alert_status_enum"),
        default=AlertStatus.PENDING,
        nullable=False
    )

    generated_date = Column(
        Date,
        default=date.today,
        nullable=False
    )

    next_service_date = Column(
        Date,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_alerts"
    )

    maintenance = relationship(
        "Maintenance",
        back_populates="alerts"
    )