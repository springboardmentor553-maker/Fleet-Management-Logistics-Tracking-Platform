from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
from app.database import Base

class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), index=True, nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    
    assignment_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assignment_status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    driver = relationship("Driver", back_populates="assignments")
    vehicle = relationship("Vehicle", back_populates="assignments")
    trip = relationship("Trip", back_populates="driver_assignments")
