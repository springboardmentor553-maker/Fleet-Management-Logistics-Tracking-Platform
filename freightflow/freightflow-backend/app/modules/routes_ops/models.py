from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow


class TripRoute(Base):
    __tablename__ = "trip_routes"

    shipment_id: Mapped[int] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    waypoints: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    distance_km: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    estimated_duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_by: Mapped[int | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    shipment = relationship("Shipment", back_populates="route")
