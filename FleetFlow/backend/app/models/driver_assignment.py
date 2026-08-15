from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

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
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    assignment_status = Column(
        String,
        nullable=False
    )

    remarks = Column(
        Text,
        nullable=True
    )

    driver = relationship(
        "Driver"
    )

    vehicle = relationship(
        "Vehicle"
    )

    trip = relationship(
        "Trip"
    )