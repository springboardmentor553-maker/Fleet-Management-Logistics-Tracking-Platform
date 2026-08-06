from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    maintenance_id = Column(
        Integer,
        ForeignKey("maintenance.id"),
        nullable=False,
    )

    alert_message = Column(
        String,
        nullable=False,
    )

    alert_type = Column(
        String,
        nullable=False,
    )

    alert_status = Column(
        String,
        nullable=False,
        default="Pending",
    )

    generated_date = Column(
        DateTime,
        default=datetime.utcnow,
    )

    next_service_date = Column(
        Date,
        nullable=False,
    )

    vehicle = relationship(
        "Vehicle"
    )

    maintenance = relationship(
        "Maintenance",
        back_populates="alerts"
    )