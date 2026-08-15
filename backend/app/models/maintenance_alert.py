import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class AlertStatus(str, enum.Enum):
    """
    Enum representing status of a maintenance alert.
    """
    PENDING = "Pending"
    SENT = "Sent"
    COMPLETED = "Completed"


class MaintenanceAlert(Base):
    """
    SQLAlchemy model representing a maintenance alert.
    """
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_id = Column(Integer, ForeignKey("maintenances.id"), nullable=False)
    alert_message = Column(Text, nullable=False)
    alert_type = Column(String(100), nullable=False)
    alert_status = Column(
        Enum(AlertStatus, name="alert_status", native_enum=True),
        default=AlertStatus.PENDING,
        nullable=False
    )
    generated_date = Column(DateTime(timezone=True), nullable=False, default=func.now())
    next_service_date = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_alerts")
    maintenance = relationship("Maintenance", back_populates="maintenance_alerts")

    def __repr__(self) -> str:
        return f"<MaintenanceAlert(id={self.id}, vehicle_id={self.vehicle_id}, maintenance_id={self.maintenance_id}, status='{self.alert_status}')>"
