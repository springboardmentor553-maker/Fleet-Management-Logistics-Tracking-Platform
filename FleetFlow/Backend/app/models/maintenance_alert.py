from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id               = Column(Integer, primary_key=True, index=True)
    vehicle_id       = Column(Integer, ForeignKey("vehicles.id"),             nullable=False, index=True)
    maintenance_id   = Column(Integer, ForeignKey("maintenance_records.id"),  nullable=False, index=True)
    alert_message    = Column(Text,    nullable=False)
    alert_type       = Column(String,  nullable=False, default="service_due")
    # service_due | overdue | health_critical | upcoming
    alert_status     = Column(String,  nullable=False, default="Pending", index=True)
    # Pending | Sent | Completed
    generated_date   = Column(DateTime, default=datetime.utcnow, nullable=False)
    next_service_date = Column(DateTime, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    vehicle     = relationship("Vehicle")
    maintenance = relationship("MaintenanceRecord")
