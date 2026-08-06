from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    category = Column(String, nullable=False)  # Oil Change, Tire Replacement, Engine Service, Brake Service, General Inspection
    description = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    completed_date = Column(DateTime, nullable=True)
    odometer_km = Column(Float, default=0.0)
    health_score = Column(Integer, default=100)  # 0 to 100 health score rating
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    service_provider = Column(String, nullable=True)
    next_service_date = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle")
