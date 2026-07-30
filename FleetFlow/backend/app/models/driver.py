"""Driver model."""

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import DriverStatusEnum


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_details = Column(String, nullable=False)

    # Task 4: Driver operational status (auto-updated on assignment/completion)
    status = Column(
        Enum(DriverStatusEnum, name="driverstatusenum"),
        nullable=False,
        default=DriverStatusEnum.AVAILABLE,
    )

    # Back-reference to User
    user = relationship("User", back_populates="driver_profile")

    # 1-to-Many: One Driver → many Vehicles over time
    vehicles = relationship("Vehicle", back_populates="driver")

    # 1-to-Many: One Driver → many Shipments
    shipments = relationship("Shipment", back_populates="driver")

    # 1-to-Many: One Driver → many Trips over time
    trips = relationship("Trip", back_populates="driver")

    # 1-to-Many: One Driver → many DriverAssignments
    assignments = relationship("DriverAssignment", back_populates="driver")

    # 1-to-Many: One Driver → many DriverAttendance records
    attendance_records = relationship("DriverAttendance", back_populates="driver")
