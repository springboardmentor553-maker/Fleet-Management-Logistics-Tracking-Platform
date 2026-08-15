from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


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
        Text,
        nullable=False
    )

    alert_type = Column(
        String,
        nullable=False
    )

    alert_status = Column(
        String,
        default="Pending",
        nullable=False
    )

    generated_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    next_service_date = Column(
        Date,
        nullable=True
    )

    vehicle = relationship(
        "Vehicle"
    )

    maintenance = relationship(
        "Maintenance"
    )