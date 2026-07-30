"""DriverAttendance model — Task 2.

One Driver → many daily attendance records.
Allowed statuses: PRESENT, ABSENT, LEAVE.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import AttendanceStatusEnum


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    # ── Unique constraint: one record per driver per date ──────
    __table_args__ = (
        UniqueConstraint("driver_id", "date", name="uq_driver_attendance_date"),
    )

    # ── Primary key ────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Key ────────────────────────────────────────────
    driver_id = Column(
        Integer, ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )

    # ── Core fields ────────────────────────────────────────────
    date = Column(Date, nullable=False)
    status = Column(
        Enum(AttendanceStatusEnum, name="attendancestatusenum"),
        nullable=False,
    )
    check_in_time  = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)

    # ── Relationship ───────────────────────────────────────────
    driver = relationship("Driver", back_populates="attendance_records")
