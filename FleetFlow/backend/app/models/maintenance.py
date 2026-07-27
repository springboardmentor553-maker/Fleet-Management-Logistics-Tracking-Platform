"""Maintenance model — Task 1 & 4.

One Vehicle → many MaintenanceRecord (1-to-Many).
Maintenance history is NEVER deleted (soft-status via CANCELLED).
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import MaintenanceCategoryEnum, MaintenanceStatusEnum


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    # ── Primary key ───────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign key: Vehicle (Task 4) ─────────────────────────────
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="RESTRICT"),  # never cascade-delete history
        nullable=False,
        index=True,
    )

    # ── Core fields (Task 1) ──────────────────────────────────────
    category = Column(
        Enum(MaintenanceCategoryEnum, name="maintenancecategoryenum"),
        nullable=False,
    )
    service_date = Column(Date, nullable=False)
    next_service_date = Column(Date, nullable=True)
    service_cost = Column(Float, nullable=True)
    service_provider = Column(String(255), nullable=True)
    status = Column(
        Enum(MaintenanceStatusEnum, name="maintenancestatusenum"),
        nullable=False,
        default=MaintenanceStatusEnum.SCHEDULED,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────────
    # Many MaintenanceRecords → 1 Vehicle
    vehicle = relationship("Vehicle", back_populates="maintenance_records")
