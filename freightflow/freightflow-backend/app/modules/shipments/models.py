from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import ShipmentStatus
from app.db.base import Base, str_enum, utcnow


class Shipment(Base):
    __tablename__ = "shipments"

    reference_code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    origin: Mapped[str] = mapped_column(String(180), nullable=False)
    destination: Mapped[str] = mapped_column(String(180), nullable=False)
    weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[ShipmentStatus] = mapped_column(str_enum(ShipmentStatus), default=ShipmentStatus.PENDING, nullable=False)

    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    route = relationship("TripRoute", back_populates="shipment", uselist=False, cascade="all, delete-orphan")
    tracking_pings = relationship("TrackingPing", back_populates="shipment", cascade="all, delete-orphan")
