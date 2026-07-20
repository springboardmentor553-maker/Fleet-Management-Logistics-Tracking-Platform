from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import relationship

from sqlalchemy.sql import func

from app.database import Base


class Trip(Base):

    __tablename__ = "trips"

    # ==========================================================
    # Primary Key
    # ==========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ==========================================================
    # Foreign Keys
    # ==========================================================

    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    # ==========================================================
    # Trip Details
    # ==========================================================

    pickup_location = Column(
        String,
        nullable=False
    )

    destination = Column(
        String,
        nullable=False
    )

    # ==========================================================
    # Google Maps Coordinates
    # ==========================================================

    pickup_latitude = Column(
        Float,
        nullable=True
    )

    pickup_longitude = Column(
        Float,
        nullable=True
    )

    destination_latitude = Column(
        Float,
        nullable=True
    )

    destination_longitude = Column(
        Float,
        nullable=True
    )

    # ==========================================================
    # Schedule
    # ==========================================================

    scheduled_start_time = Column(
        DateTime,
        nullable=False
    )

    scheduled_end_time = Column(
        DateTime,
        nullable=False
    )

    # ==========================================================
    # Status
    # ==========================================================

    trip_status = Column(
        String,
        default="Scheduled",
        nullable=False
    )

    # ==========================================================
    # Created At
    # ==========================================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # ==========================================================
    # Relationships
    # ==========================================================

    shipment = relationship(
        "Shipment",
        back_populates="trip"
    )

    driver = relationship(
        "Driver",
        back_populates="trips"
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="trips"
    )