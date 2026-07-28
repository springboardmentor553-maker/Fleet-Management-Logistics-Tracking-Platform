from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
    Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class TripStatus(enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    STARTED = "STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    trip_number = Column(
        String,
        unique=True,
        nullable=False
    )

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
    pickup_location = Column(
    String,
    nullable=False
    )
    destination = Column(
    String,
    nullable=False
    )

    route_id = Column(
        Integer,
        ForeignKey("routes.id"),
        nullable=False
    )

    start_date = Column(DateTime)

    expected_end_date = Column(DateTime)

    actual_end_date = Column(DateTime)

    status = Column(
        Enum(TripStatus),
        default=TripStatus.CREATED,
        nullable=False
    )

    notes = Column(String)
    pickup_latitude = Column(
        Float,
        nullable=False
    )


    pickup_longitude = Column(
        Float,
        nullable=False
    )


    destination_latitude = Column(
        Float,
        nullable=False
    )


    destination_longitude = Column(
        Float,
        nullable=False
    )



    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    shipment = relationship(
    "Shipment",
    back_populates="trips"
    )
    driver = relationship(
    "Driver",
    back_populates="trips"
    )
    vehicle = relationship(
    "Vehicle",
    back_populates="trips"
    )
    route = relationship(
    "Route",
    back_populates="trips"
    )