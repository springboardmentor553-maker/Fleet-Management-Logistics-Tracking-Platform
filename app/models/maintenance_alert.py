from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_id = Column(Integer, ForeignKey("maintenance_records.id"), nullable=False)

    alert_message = Column(String(300), nullable=False)
    alert_type = Column(String(50), default="Reminder")
    alert_status = Column(String(50), default="Pending")

    generated_date = Column(DateTime, server_default=func.now())
    next_service_date = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle")
    maintenance = relationship("Maintenance")