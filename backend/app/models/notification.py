from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    status = Column(
        String(50),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(
            ZoneInfo("Asia/Kolkata")
        ),
        nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<Notification("
            f"id={self.id}, "
            f"title='{self.title}', "
            f"status='{self.status}')>"
        )