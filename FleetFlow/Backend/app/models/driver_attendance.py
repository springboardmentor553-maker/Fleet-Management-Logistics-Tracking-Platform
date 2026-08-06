from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)

    attendance_date = Column(Date, nullable=False)

    status = Column(
        String,
        default="present"
    )  # present, absent, on_leave

    check_in = Column(String, nullable=True)

    check_out = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver")