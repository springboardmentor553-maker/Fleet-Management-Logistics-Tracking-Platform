from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    date = Column(
        DateTime,
        default=datetime.utcnow
    )

    attendance_status = Column(
        String,
        nullable=False
    )

    check_in_time = Column(
        DateTime,
        nullable=True
    )

    check_out_time = Column(
        DateTime,
        nullable=True
    )

    driver = relationship(
        "Driver",
        back_populates="attendance_records"
    )