from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceAlert(Base):

    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)

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
        String,
        nullable=False
    )

    alert_type = Column(
        String,
        nullable=False
    )

    alert_status = Column(
        String,
        default="Pending"
    )

    generated_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    next_service_date = Column(
        Date,
        nullable=False
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_alerts"
    )

    maintenance = relationship(
        "MaintenanceRecord",
        back_populates="alerts"
    )