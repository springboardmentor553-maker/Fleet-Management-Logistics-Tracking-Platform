from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from sqlalchemy.orm import relationship

from app.database import Base


class Shipment(Base):

    __tablename__ = "shipments"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # SHIPMENT DETAILS
    # =====================================================

    tracking_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    status = Column(
        String,
        nullable=False,
        default="Pending"
    )

    origin = Column(
        String,
        nullable=False
    )

    destination = Column(
        String,
        nullable=False
    )

    # =====================================================
    # SENDER / RECEIVER
    # =====================================================

    sender_name = Column(
        String,
        nullable=True
    )

    receiver_name = Column(
        String,
        nullable=True
    )

    # =====================================================
    # CURRENT LOCATION
    # =====================================================

    current_location = Column(
        String,
        nullable=True
    )

    # =====================================================
    # CREATED DATE
    # =====================================================

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # =====================================================
    # PICKUP / DELIVERY DATES
    # =====================================================

    pickup_date = Column(
        DateTime,
        nullable=True
    )

    delivery_date = Column(
        DateTime,
        nullable=True
    )

    # =====================================================
    # RELATIONSHIP WITH TRIPS
    # =====================================================

    trips = relationship(
        "Trip",
        back_populates="shipment"
    )