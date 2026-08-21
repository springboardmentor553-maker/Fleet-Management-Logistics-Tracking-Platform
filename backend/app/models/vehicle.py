from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):

    __tablename__ = "vehicles"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # VEHICLE DETAILS
    # =====================================================

    vehicle_number = Column(
        String,
        unique=True,
        nullable=False
    )

    vehicle_type = Column(
        String,
        nullable=False
    )

    capacity = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        default="Available"
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    # One Vehicle -> Many Trips
    trips = relationship(
        "Trip",
        back_populates="vehicle"
    )

    # One Vehicle -> Many Driver Assignments
    assignments = relationship(
        "DriverAssignment",
        back_populates="vehicle"
    )

    # One Vehicle -> Many Fuel Records
    fuel_records = relationship(
        "Fuel",
        back_populates="vehicle"
    )