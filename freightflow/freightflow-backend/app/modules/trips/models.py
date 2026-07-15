from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import TripStatus
from app.db.base import Base, str_enum, utcnow


class Trip(Base):
    __tablename__ = "trips"

    # --- Foreign keys -----------------------------------------------------
    # A Shipment belongs to exactly one Trip -> unique FK enforces the 1-to-1.
    shipment_id: Mapped[int] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    # A Driver can have many Trips (over time) -> plain FK, no uniqueness.
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    # A Vehicle can have many Trips (over time) -> plain FK, no uniqueness.
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False)

    # --- Trip details -------------------------------------------------------
    pickup_location: Mapped[str] = mapped_column(String(180), nullable=False)
    destination: Mapped[str] = mapped_column(String(180), nullable=False)
    scheduled_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[TripStatus] = mapped_column(str_enum(TripStatus), default=TripStatus.SCHEDULED, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # --- Relationships ------------------------------------------------------
    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
