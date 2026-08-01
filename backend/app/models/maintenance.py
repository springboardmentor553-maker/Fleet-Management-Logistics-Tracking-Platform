from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenances"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_category = Column(String, nullable=False)
    service_date = Column(DateTime, nullable=False)
    next_service_date = Column(DateTime, nullable=True)
    service_cost = Column(Float, nullable=True)
    service_provider = Column(String, nullable=True)
    maintenance_status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenances")
