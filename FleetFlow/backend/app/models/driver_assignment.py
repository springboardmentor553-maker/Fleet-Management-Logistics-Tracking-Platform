"""DriverAssignment model — Task 1.

Tracks which driver is assigned to which vehicle and trip.
One Driver → many Assignments (one per trip, historically preserved).
"""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import AssignmentStatusEnum


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    # ── Primary key ────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Keys ───────────────────────────────────────────
    driver_id = Column(
        Integer, ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    vehicle_id = Column(
        Integer, ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    trip_id = Column(
        Integer, ForeignKey("trips.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )

    # ── Core fields ────────────────────────────────────────────
    assignment_date = Column(DateTime(timezone=True), nullable=False,
                             default=lambda: datetime.now(timezone.utc))
    status = Column(
        Enum(AssignmentStatusEnum, name="assignmentstatusenum"),
        nullable=False,
        default=AssignmentStatusEnum.ACTIVE,
    )
    remarks = Column(Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────
    driver  = relationship("Driver",  back_populates="assignments")
    vehicle = relationship("Vehicle", back_populates="assignments")
    trip    = relationship("Trip",    back_populates="assignment")
