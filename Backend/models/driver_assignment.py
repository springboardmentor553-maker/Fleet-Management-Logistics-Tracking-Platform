from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False
    )

    assignment_date = Column(
        Date,
        nullable=False
    )

    assignment_status = Column(
        String(50),
        nullable=False,
        default="Assigned"
    )

    remarks = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
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
        back_populates="assignments"
    )