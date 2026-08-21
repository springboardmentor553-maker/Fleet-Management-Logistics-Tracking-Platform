from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Date
)

from sqlalchemy.orm import relationship

from app.database import Base


class DriverAssignment(Base):

    __tablename__ = "driver_assignments"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # DRIVER
    # =====================================================

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    # =====================================================
    # VEHICLE
    # =====================================================

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    # =====================================================
    # TRIP
    # =====================================================

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False
    )

    # =====================================================
    # ASSIGNMENT DATE
    # =====================================================

    assignment_date = Column(
        Date,
        nullable=False
    )

    # =====================================================
    # RELEASE DATE
    # =====================================================

    release_date = Column(
        Date,
        nullable=True
    )

    # =====================================================
    # STATUS
    # =====================================================

    status = Column(
        String,
        nullable=False,
        default="Assigned"
    )

    # =====================================================
    # REMARKS
    # =====================================================

    remarks = Column(
        String,
        nullable=True
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    driver = relationship(
        "Driver",
        back_populates="assignments"
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="assignments"
    )

    trip = relationship(
        "Trip",
        back_populates="driver_assignments"
    )