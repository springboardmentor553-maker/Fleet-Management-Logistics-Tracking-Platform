from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    maintenance_category = Column(String(50), nullable=False)
    service_date = Column(DateTime, nullable=False)
    next_service_date = Column(DateTime, nullable=True)
    service_cost = Column(Float, nullable=False)
    service_provider = Column(String(100), nullable=False)
    maintenance_status = Column(String(50), default="Scheduled")
    notes = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="maintenance_records")