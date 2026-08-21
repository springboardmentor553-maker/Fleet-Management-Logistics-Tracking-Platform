from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Trip(Base):

    __tablename__ = "trips"

    # ========================================================
    # ID
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ========================================================
    # FOREIGN KEYS
    # ========================================================

    shipment_id = Column(
        Integer,
        ForeignKey(
            "shipments.id"
        ),
        nullable=False,
        index=True
    )

    vehicle_id = Column(
        Integer,
        ForeignKey(
            "vehicles.id"
        ),
        nullable=False,
        index=True
    )

    driver_id = Column(
        Integer,
        ForeignKey(
            "drivers.id"
        ),
        nullable=False,
        index=True
    )

    # ========================================================
    # LOCATIONS
    # ========================================================

    start_location = Column(
        String,
        nullable=False
    )

    end_location = Column(
        String,
        nullable=False
    )

    # ========================================================
    # TIME
    # ========================================================

    departure_time = Column(
        DateTime,
        nullable=False
    )

    expected_arrival = Column(
        DateTime,
        nullable=True
    )

    actual_arrival = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True
    )

    # ========================================================
    # STATUS
    # ========================================================

    status = Column(
        String,
        nullable=False,
        default="Scheduled"
    )

    # ========================================================
    # CURRENT GPS
    # ========================================================

    current_latitude = Column(
        String,
        nullable=True
    )

    current_longitude = Column(
        String,
        nullable=True
    )

    # ========================================================
    # DESTINATION GPS
    # ========================================================

    destination_latitude = Column(
        String,
        nullable=True
    )

    destination_longitude = Column(
        String,
        nullable=True
    )

    # ========================================================
    # DISTANCE
    # ========================================================

    distance = Column(
        Float,
        nullable=True
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    shipment = relationship(
        "Shipment",
        back_populates="trips"
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="trips"
    )

    driver = relationship(
        "Driver",
        back_populates="trips"
    )

    driver_assignments = relationship(
        "DriverAssignment",
        back_populates="trip"
    )