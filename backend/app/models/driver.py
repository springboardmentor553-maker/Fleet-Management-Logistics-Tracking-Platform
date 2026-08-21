from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):

    __tablename__ = "drivers"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # DRIVER DETAILS
    # =====================================================

    name = Column(
        String,
        nullable=False
    )

    license_number = Column(
        String,
        unique=True,
        nullable=False
    )

    phone = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    status = Column(
        String,
        default="Available"
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    # One Driver -> Many Trips
    trips = relationship(
        "Trip",
        back_populates="driver"
    )

    # One Driver -> Many Driver Assignments
    assignments = relationship(
        "DriverAssignment",
        back_populates="driver"
    )