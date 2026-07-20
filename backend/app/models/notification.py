from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(150), nullable=False)

    message = Column(String(500), nullable=False)

    type = Column(String(50), default="info")

    is_read = Column(Boolean, default=False)

    created_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False
    )