import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    """
    Enum representing status of a shipment.
    """
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Shipment(Base):
    """
    SQLAlchemy model representing a shipment.
    """
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_number = Column(String(100), unique=True, index=True, nullable=False)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    status = Column(
        Enum(ShipmentStatus, name="shipment_status", native_enum=True),
        default=ShipmentStatus.PENDING,
        nullable=False
    )
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="SET NULL"),
        nullable=True
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True
    )
    weight = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    actual_delivery = Column(DateTime(timezone=True), nullable=True)
    
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
    driver = relationship("Driver", back_populates="shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")

    def __repr__(self) -> str:
        return f"<Shipment(id={self.id}, shipment_number='{self.shipment_number}', status='{self.status}')>"
