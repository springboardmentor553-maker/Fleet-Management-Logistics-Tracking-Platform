from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.enums.trip_status import TripStatus


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id"),
        unique=True,
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

    pickup_location = Column(
        String,
        nullable=False
    )

    delivery_location = Column(
        String,
        nullable=False
    )

    scheduled_start_time = Column(
        DateTime(timezone=True),
        nullable=False
    )

    scheduled_end_time = Column(
        DateTime(timezone=True),
        nullable=False
    )

    trip_status = Column(
        String,
        default=TripStatus.SCHEDULED.value,
        nullable=False
    )

    started_at = Column(
    DateTime(timezone=True),
    nullable=True
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

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