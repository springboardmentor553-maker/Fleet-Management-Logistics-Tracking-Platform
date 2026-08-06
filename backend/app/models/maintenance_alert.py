from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.app.database import Base


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_id = Column(Integer, ForeignKey("maintenances.id"), nullable=False)
    alert_message = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    alert_status = Column(String, default="Pending")
    generated_date = Column(DateTime, default=datetime.utcnow)
    next_service_date = Column(DateTime, nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_alerts")
    maintenance = relationship("Maintenance", back_populates="alerts")
