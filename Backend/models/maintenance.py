from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.maintenance_enum import MaintenanceCategory


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key to Vehicle
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    # Maintenance Details
    maintenance_category = Column(
        Enum(MaintenanceCategory, name="maintenance_category_enum"),
        nullable=False
    )
    service_date = Column(Date, nullable=False)
    next_service_date = Column(Date, nullable=True)

    service_cost = Column(Float, nullable=False)
    service_provider = Column(String(255), nullable=False)

    maintenance_status = Column(
        String(50),
        nullable=False,
        default="Scheduled"
    )

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    vehicle = relationship("Vehicle", back_populates="maintenance_records")
    alerts = relationship(
    "MaintenanceAlert",
    back_populates="maintenance",
    cascade="all, delete-orphan"
)