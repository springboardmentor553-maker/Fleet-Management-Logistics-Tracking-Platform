from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class DriverAttendance(Base):

    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    date = Column(Date, nullable=False)

    attendance_status = Column(
        String,
        nullable=False
    )

    check_in_time = Column(Time)

    check_out_time = Column(Time)

    driver = relationship(
        "Driver",
        backref="attendance"
    )