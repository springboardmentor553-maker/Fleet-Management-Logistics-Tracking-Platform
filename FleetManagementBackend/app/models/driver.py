from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    shipments = relationship(
        "Shipment",
        back_populates="driver"
    )
    routes = relationship(
        "Route",
        back_populates="driver"
    )

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True)

    phone = Column(String)

    license_number = Column(String, unique=True)

    experience = Column(Integer)

    status = Column(String)
    trips = relationship(
    "Trip",
    back_populates="driver"
    )
    assignments = relationship(
    "DriverAssignment",
    back_populates="driver",
    cascade="all, delete-orphan"
    )
    # Driver Attendance
    attendance_records = relationship(
        "DriverAttendance",
        back_populates="driver",
        cascade="all, delete-orphan"
        )
    fuel_records = relationship(
    "FuelRecord",
    back_populates="driver",
    cascade="all, delete-orphan"
)