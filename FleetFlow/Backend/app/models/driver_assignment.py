from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)

    assignment_date = Column(DateTime, default=datetime.utcnow)

    assignment_status = Column(
        String,
        default="Assigned"
    )   # Assigned, Completed, Cancelled

    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver")
    vehicle = relationship("Vehicle")
    trip = relationship("Trip")