from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship, validates

from backend.app.database import Base

VALID_ATTENDANCE_STATUSES = {"Present", "Absent", "Leave"}


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    date = Column(Date, nullable=False)
    attendance_status = Column(String, nullable=False)
    check_in_time = Column(Time, nullable=True)
    check_out_time = Column(Time, nullable=True)

    # Relationship
    driver = relationship("Driver", back_populates="attendances")

    @validates("attendance_status")
    def validate_attendance_status(self, key, value):
        if value not in VALID_ATTENDANCE_STATUSES:
            raise ValueError(
                f"Invalid attendance_status '{value}'. "
                f"Allowed values: {VALID_ATTENDANCE_STATUSES}"
            )
        return value
