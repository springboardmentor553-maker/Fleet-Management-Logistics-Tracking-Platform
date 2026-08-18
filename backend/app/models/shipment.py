import enum
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    """
    Enum representing status of a shipment.
    """
    CREATED = "created"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELAYED = "delayed"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Shipment(Base):
    """
    SQLAlchemy model representing a shipment.
    """
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(100), unique=True, index=True, nullable=False)
    sender_name = Column(String(255), nullable=False)
    receiver_name = Column(String(255), nullable=False)
    pickup_location = Column(String(255), nullable=False)
    delivery_location = Column(String(255), nullable=False)
    current_status = Column(
        Enum(ShipmentStatus, name="shipment_status", native_enum=True, values_callable=lambda obj: [e.value for e in obj]),
        default=ShipmentStatus.CREATED,
        nullable=False
    )
    weight = Column(Float, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    assigned_driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    assigned_vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )

    # Relationships
    driver = relationship("Driver", back_populates="shipments", foreign_keys=[assigned_driver_id])
    vehicle = relationship("Vehicle", back_populates="shipments", foreign_keys=[assigned_vehicle_id])
    trip = relationship("Trip", back_populates="shipment", uselist=False, cascade="all, delete-orphan")

    # Backward compatibility properties for schemas and other logic
    @property
    def shipment_number(self) -> str:
        return self.tracking_number

    @property
    def origin(self) -> str:
        return self.pickup_location

    @property
    def destination(self) -> str:
        return self.delivery_location

    @property
    def status(self) -> ShipmentStatus:
        return self.current_status

    @property
    def driver_id(self) -> int:
        return self.assigned_driver_id

    @property
    def vehicle_id(self) -> int:
        return self.assigned_vehicle_id

    @property
    def trip_id(self) -> Optional[int]:
        return self.trip.id if self.trip else None

    def __repr__(self) -> str:
        return f"<Shipment(id={self.id}, tracking_number='{self.tracking_number}', current_status='{self.current_status}')>"
