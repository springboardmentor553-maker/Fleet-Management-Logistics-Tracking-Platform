from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        unique=True,
        nullable=True
    )
    registration_number = Column(String, unique=True, nullable=False)

    vehicle_type = Column(String, nullable=False)

    capacity = Column(Integer, nullable=False)

    fuel_type = Column(String, nullable=False)

    current_status = Column(String, default="Available")

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship(
        "Driver",
        back_populates="vehicle"
    )

    shipments = relationship(
        "Shipment",
        back_populates="vehicle"
    )