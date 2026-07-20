"""Trip model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import TripStatusEnum


class Trip(Base):
    """Represents a single logistics trip that carries a shipment."""

    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    # UNIQUE ensures a shipment can belong to at most one trip
    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Trip logistics details
    pickup_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    # Coordinates – populated by the geocoding service
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)

    scheduled_start_time = Column(DateTime, nullable=False)
    scheduled_end_time = Column(DateTime, nullable=True)

    # Status
    status = Column(
        Enum(TripStatusEnum, name="tripstatusenum"),
        default=TripStatusEnum.SCHEDULED,
        nullable=False,
    )

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
