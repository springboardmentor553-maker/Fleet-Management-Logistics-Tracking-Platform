from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    is_available = Column(Boolean, default=True)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    attendance_status = Column(String, default="present")  # present, absent, on_leave
    safety_score = Column(Integer, default=95)            # 0 to 100
    completed_trips_count = Column(Integer, default=0)
    total_distance_km = Column(Float, default=0.0)
    rating = Column(Float, default=4.8)                   # 1.0 to 5.0
    created_at = Column(DateTime, default=datetime.utcnow)

    shipments = relationship("Shipment", back_populates="driver")
    assigned_vehicle = relationship("Vehicle", foreign_keys=[assigned_vehicle_id])
