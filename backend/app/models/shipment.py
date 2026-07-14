import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    IN_TRANSIT = "In Transit"
    DELAYED = "Delayed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(100), unique=True, nullable=False)
    sender_name = Column(String(100), nullable=False)
    receiver_name = Column(String(100), nullable=False)
    pickup_location = Column(String(100), nullable=False)
    delivery_location = Column(String(100), nullable=False)
    current_status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False)
    weight = Column(Float, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    driver = relationship("Driver")
    vehicle = relationship("Vehicle", back_populates="shipments")
    trip = relationship("Trip", back_populates="shipment", uselist=False)