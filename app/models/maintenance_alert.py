from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_id = Column(Integer, ForeignKey("maintenance_records.id"), nullable=False)

    alert_message = Column(String(300), nullable=False)
    alert_status = Column(String(50), default="Active")

    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle")
    maintenance = relationship("Maintenance")