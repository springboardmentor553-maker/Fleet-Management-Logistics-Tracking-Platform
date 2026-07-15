from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import DriverStatus
from app.db.base import Base, str_enum, utcnow


class Driver(Base):
    __tablename__ = "drivers"

    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), unique=True, nullable=False)
    license_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[DriverStatus] = mapped_column(str_enum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    account = relationship("Account", back_populates="driver_profile")
    # A Driver can have many Trips over time.
    trips = relationship("Trip", back_populates="driver")
