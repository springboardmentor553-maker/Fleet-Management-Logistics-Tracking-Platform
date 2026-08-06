from app.enums import (
    MaintenanceCategory,
    MaintenanceStatus
)

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    maintenance_category = Column(
        String,
        nullable=False,
        default=MaintenanceCategory.GENERAL_INSPECTION.value
    )

    service_date = Column(
        DateTime,
        nullable=False
    )

    next_service_date = Column(
        DateTime,
        nullable=False
    )

    service_cost = Column(
        Float,
        nullable=False
    )

    service_provider = Column(
        String,
        nullable=False
    )

    maintenance_status = Column(
        String,
        nullable=False,
        default=MaintenanceStatus.PENDING.value
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_records"
        )

    alerts = relationship(
        "MaintenanceAlert",
        back_populates="maintenance",
        cascade="all, delete-orphan"
        )