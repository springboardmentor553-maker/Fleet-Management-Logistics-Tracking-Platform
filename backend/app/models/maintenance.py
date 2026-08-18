from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MaintenanceRecord(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    maintenance_category = Column(
        String,
        nullable=False
    )

    service_date = Column(
        Date,
        nullable=False
    )

    next_service_date = Column(
        Date,
        nullable=False
    )

    service_cost = Column(
        Float,
        nullable=False
    )

    service_provider = Column(
        String,
        nullable=False
    )

    maintenance_status = Column(
        String,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=True
    )

    is_active = Column(
        Integer,
        default=1,
        nullable=True
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_records"
    )

    alerts = relationship(
        "MaintenanceAlert",
        back_populates="maintenance"
    )

    def __repr__(self):
        return (
            f"<MaintenanceRecord("
            f"id={self.id}, "
            f"vehicle_id={self.vehicle_id}, "
            f"category='{self.maintenance_category}', "
            f"status='{self.maintenance_status}')>"
        )