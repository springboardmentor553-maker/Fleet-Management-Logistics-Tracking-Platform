from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Notification(Base):
    """
    SQLAlchemy model representing a notification.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    level = Column(String(50), nullable=False, default="info")
    is_read = Column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return (
            f"<Notification(id={self.id}, "
            f"title='{self.title}', level='{self.level}')>"
        )