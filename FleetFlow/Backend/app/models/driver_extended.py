from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    status = Column(String, default="present")  # present, absent, on_leave
    check_in = Column(String, nullable=True)   # HH:MM AM/PM
    check_out = Column(String, nullable=True)  # HH:MM AM/PM
    created_at = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver")


class DriverActivityLog(Base):
    __tablename__ = "driver_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver")
