from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone, date
from app.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"

class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    date = Column(Date, default=date.today)
    attendance_status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    driver = relationship("Driver", back_populates="attendance_records")
