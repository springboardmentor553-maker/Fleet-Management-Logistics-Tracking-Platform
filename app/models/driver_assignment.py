from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)

    assignment_date = Column(DateTime, nullable=False)
    assignment_status = Column(String(50), default="Active")
    remarks = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    driver = relationship("Driver")
    vehicle = relationship("Vehicle")
    trip = relationship("Trip")