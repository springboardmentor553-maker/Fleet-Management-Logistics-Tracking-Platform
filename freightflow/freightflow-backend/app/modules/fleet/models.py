from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import VehicleStatus
from app.db.base import Base, str_enum, utcnow


class Vehicle(Base):
    __tablename__ = "vehicles"

    plate_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[VehicleStatus] = mapped_column(str_enum(VehicleStatus), default=VehicleStatus.ACTIVE, nullable=False)
    odometer_km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    purchased_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")
