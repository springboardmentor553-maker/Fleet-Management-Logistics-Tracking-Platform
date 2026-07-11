from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import NotificationCategory
from app.db.base import Base, str_enum, utcnow


class Notification(Base):
    __tablename__ = "notifications"

    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[NotificationCategory] = mapped_column(str_enum(NotificationCategory), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
