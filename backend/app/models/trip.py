from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # SHIPMENT
    # =====================================================

    shipment_id = Column(
        Integer,
        ForeignKey(
            "shipments.id",
        ),
        unique=True,
        nullable=False,
    )

    # =====================================================
    # DRIVER
    # =====================================================

    driver_id = Column(
        Integer,
        ForeignKey(
            "drivers.id",
        ),
        nullable=False,
    )

    # =====================================================
    # VEHICLE
    # =====================================================

    vehicle_id = Column(
        Integer,
        ForeignKey(
            "vehicles.id",
        ),
        nullable=False,
    )

    # =====================================================
    # ROUTE LOCATIONS
    # =====================================================

    pickup_location = Column(
        String(255),
        nullable=False,
    )

    destination = Column(
        String(255),
        nullable=False,
    )

    # =====================================================
    # PICKUP COORDINATES
    # =====================================================

    pickup_latitude = Column(
        String(50),
        nullable=True,
    )

    pickup_longitude = Column(
        String(50),
        nullable=True,
    )

    # =====================================================
    # DESTINATION COORDINATES
    # =====================================================

    destination_latitude = Column(
        String(50),
        nullable=True,
    )

    destination_longitude = Column(
        String(50),
        nullable=True,
    )

    # =====================================================
    # SCHEDULE
    # =====================================================

    scheduled_start_time = Column(
        DateTime,
        nullable=False,
    )

    scheduled_end_time = Column(
        DateTime,
        nullable=False,
    )

    # =====================================================
    # STATUS
    #
    # Python attribute : trip_status
    # Database column  : trip_status
    # =====================================================

    trip_status = Column(
        String(50),
        default="Scheduled",
        nullable=True,
    )

    # =====================================================
    # CREATED TIME
    # =====================================================

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    shipment = relationship(
        "Shipment",
        back_populates="trip",
        uselist=False,
    )

    driver = relationship(
        "Driver",
        back_populates="trips",
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="trips",
    )

    route = relationship(
        "Route",
        back_populates="trip",
        uselist=False,
    )
    

    # =====================================================
    # REPRESENTATION
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<Trip("
            f"id={self.id}, "
            f"shipment_id={self.shipment_id}, "
            f"status='{self.trip_status}')>"
        )