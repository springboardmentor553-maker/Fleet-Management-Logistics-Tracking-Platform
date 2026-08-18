import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class VehicleStatus(str, enum.Enum):
    """
    Enum representing status of a vehicle.
    """

    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class Vehicle(Base):
    """
    SQLAlchemy model representing a vehicle.
    """

    __tablename__ = "vehicles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    make = Column(
        String(100),
        nullable=False
    )

    model = Column(
        String(100),
        nullable=False
    )

    year = Column(
        Integer,
        nullable=False
    )

    license_plate = Column(
        String(20),
        unique=True,
        nullable=False
    )

    vin = Column(
        String(17),
        unique=True,
        nullable=True
    )

    # Database stores status as VARCHAR
    status = Column(
        String(50),
        nullable=False,
        default=VehicleStatus.ACTIVE.value
    )

    capacity_weight = Column(
        Float,
        nullable=True
    )

    capacity_volume = Column(
        Float,
        nullable=True
    )

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

    # =========================================================
    # Relationships
    # =========================================================

    shipments = relationship(
        "Shipment",
        back_populates="vehicle"
    )

    maintenance_records = relationship(
        "MaintenanceRecord",
        back_populates="vehicle"
    )

    maintenance_alerts = relationship(
        "MaintenanceAlert",
        back_populates="vehicle"
    )

    trips = relationship(
        "Trip",
        back_populates="vehicle"
    )

    fuel_logs = relationship(
        "FuelLog",
        back_populates="vehicle"
    )

    def __repr__(self) -> str:
        return (
            f"<Vehicle("
            f"id={self.id}, "
            f"license_plate='{self.license_plate}', "
            f"status='{self.status}')>"
        )