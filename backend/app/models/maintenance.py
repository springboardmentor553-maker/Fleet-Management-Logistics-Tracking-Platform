import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceCategory(str, enum.Enum):
    """
    Enum representing categories of maintenance.
    """
    OIL_CHANGE = "Oil Change"
    TYRE_REPLACEMENT = "Tyre Replacement"
    BRAKE_SERVICE = "Brake Service"
    ENGINE_SERVICE = "Engine Service"
    GENERAL_INSPECTION = "General Inspection"


class MaintenanceStatus(str, enum.Enum):
    """
    Enum representing status of maintenance.
    """
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Maintenance(Base):
    """
    SQLAlchemy model representing a maintenance record for a vehicle.
    """
    __tablename__ = "maintenances"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    maintenance_category = Column(
        Enum(MaintenanceCategory, name="maintenance_category", native_enum=True),
        nullable=False
    )
    service_date = Column(DateTime(timezone=True), nullable=False)
    next_service_date = Column(DateTime(timezone=True), nullable=True)
    service_cost = Column(Float, nullable=True)
    service_provider = Column(String(255), nullable=True)
    maintenance_status = Column(
        Enum(MaintenanceStatus, name="maintenance_status", native_enum=True),
        default=MaintenanceStatus.SCHEDULED,
        nullable=False
    )
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenances")
    maintenance_alerts = relationship("MaintenanceAlert", back_populates="maintenance", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Maintenance(id={self.id}, vehicle_id={self.vehicle_id}, category='{self.maintenance_category}', status='{self.maintenance_status}')>"
