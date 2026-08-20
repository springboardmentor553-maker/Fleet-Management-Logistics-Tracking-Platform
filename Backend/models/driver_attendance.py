from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.driver_attendance_enum import AttendanceStatus


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )

    attendance_status = Column(
    Enum(AttendanceStatus),
    nullable=False
)

    check_in_time = Column(
        Time,
        nullable=True
    )

    check_out_time = Column(
        Time,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    driver = relationship(
        "Driver",
        back_populates="attendance_records"
    )