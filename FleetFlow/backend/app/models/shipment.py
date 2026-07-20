"""Shipment model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ShipmentStatusEnum


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    # Auto-generated tracking number, e.g. FLT100001
    tracking_number = Column(String, unique=True, nullable=False, index=True)

    # Sender / Receiver information
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)

    # Locations
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)

    # Shipment status
    status = Column(
        Enum(ShipmentStatusEnum, name="shipmentstatusenum"),
        default=ShipmentStatusEnum.CREATED,
        nullable=False,
    )

    # Cargo details
    weight = Column(Float, nullable=False)  # in kg

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    eta = Column(DateTime, nullable=True)

    # Foreign Keys: Shipment can have an assigned Driver and Vehicle
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Back-references
    driver = relationship("Driver", back_populates="shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")

    # 1-to-1: A Shipment belongs to at most one Trip
    trip = relationship("Trip", back_populates="shipment", uselist=False)
