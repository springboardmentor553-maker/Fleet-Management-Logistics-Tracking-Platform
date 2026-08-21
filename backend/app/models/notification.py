from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)

from datetime import datetime

from app.database import Base


class Notification(Base):

    __tablename__ = "notifications"


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


    title = Column(
        String,
        nullable=False,
    )


    message = Column(
        String,
        nullable=False,
    )


    notification_type = Column(
        String,
        nullable=False,
        default="system",
    )


    related_entity = Column(
        String,
        nullable=True,
    )


    related_id = Column(
        Integer,
        nullable=True,
    )


    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )