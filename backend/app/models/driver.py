from sqlalchemy import Column, Integer, String
from app.database import Base
from sqlalchemy.orm import relationship


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)

    # Driver Status
    status = Column(
        String,
        nullable=False,
        default="available"
    )

    trips = relationship(
        "Trip",
        back_populates="driver"
    )

    assignments = relationship(
        "DriverAssignment",
        back_populates="driver"
    )

    attendance_records = relationship(
        "DriverAttendance",
        back_populates="driver"
    )

    fuel_records = relationship(
        "FuelRecord",
        back_populates="driver"
    )