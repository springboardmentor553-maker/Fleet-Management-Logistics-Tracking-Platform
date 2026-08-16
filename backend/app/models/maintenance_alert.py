from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import AlertStatusEnum


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_id = Column(Integer, ForeignKey("maintenance_records.id"), nullable=False)
    alert_message = Column(String(255), nullable=False)
    alert_type = Column(String(50), nullable=False)
    status = Column(Enum(AlertStatusEnum), default=AlertStatusEnum.PENDING, nullable=False)
    generated_date = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    next_service_date = Column(Date, nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_alerts")
    maintenance = relationship("MaintenanceRecord", back_populates="maintenance_alerts")
