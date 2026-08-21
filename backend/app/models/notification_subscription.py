from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)

from datetime import datetime

from app.database import Base


class NotificationSubscription(Base):

    __tablename__ = (
        "notification_subscriptions"
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    endpoint = Column(
        String,
        nullable=False,
        unique=True,
    )

    p256dh = Column(
        String,
        nullable=False,
    )

    auth = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )