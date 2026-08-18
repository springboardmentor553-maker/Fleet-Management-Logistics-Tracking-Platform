from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)

from app.database import Base


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    # NEW
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)

    assigned_at = Column(DateTime, default=datetime.utcnow)

    status = Column(String, default="Assigned")
    driver = relationship(
        "Driver",
        back_populates="assignments"
    )
    vehicle = relationship(
        "Vehicle"
    )
    trip = relationship(
        "Trip"
    )