from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import MaintenanceType
from app.db.base import Base, str_enum, utcnow


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    service_type: Mapped[MaintenanceType] = mapped_column(str_enum(MaintenanceType), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    performed_by: Mapped[str] = mapped_column(String(120), nullable=False)
    performed_at: Mapped[date] = mapped_column(Date, nullable=False)
    next_due_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
