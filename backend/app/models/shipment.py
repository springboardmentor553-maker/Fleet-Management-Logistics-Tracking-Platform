from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Shipment(Base):
    """
    SQLAlchemy model representing a shipment.

    This model matches the existing PostgreSQL
    shipments table.
    """

    __tablename__ = "shipments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tracking_number = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    sender_name = Column(
        String(255),
        nullable=False
    )

    receiver_name = Column(
        String(255),
        nullable=False
    )

    pickup_location = Column(
        String(255),
        nullable=False
    )

    delivery_location = Column(
        String(255),
        nullable=False
    )

    current_status = Column(
        String(50),
        nullable=False
    )

    weight = Column(
        Float,
        nullable=True
    )

    created_date = Column(
        DateTime(timezone=True),
        nullable=False
    )

    assigned_driver_id = Column(
        Integer,
        ForeignKey(
            "drivers.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    assigned_vehicle_id = Column(
        Integer,
        ForeignKey(
            "vehicles.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    # ---------------------------------------------------------
    # Relationships
    # ---------------------------------------------------------

    driver = relationship(
        "Driver",
        back_populates="shipments",
        foreign_keys=[assigned_driver_id]
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="shipments",
        foreign_keys=[assigned_vehicle_id]
    )

    trip = relationship(
        "Trip",
        back_populates="shipment",
        uselist=False
    )

    def __repr__(self) -> str:
        return (
            f"<Shipment("
            f"id={self.id}, "
            f"tracking_number='{self.tracking_number}', "
            f"status='{self.current_status}')>"
        )