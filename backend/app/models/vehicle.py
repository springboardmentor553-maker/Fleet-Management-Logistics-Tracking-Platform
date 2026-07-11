import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
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

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    license_plate = Column(String(20), unique=True, nullable=False)
    vin = Column(String(17), unique=True, nullable=True)
    status = Column(
        Enum(VehicleStatus, name="vehicle_status", native_enum=True),
        default=VehicleStatus.ACTIVE,
        nullable=False
    )
    capacity_weight = Column(Float, nullable=True)
    capacity_volume = Column(Float, nullable=True)
    
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
    shipments = relationship("Shipment", back_populates="vehicle")

    def __repr__(self) -> str:
        return f"<Vehicle(id={self.id}, license_plate='{self.license_plate}', status='{self.status}')>"
