from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Route(Base):
    """
    SQLAlchemy model representing a route.
    """

    __tablename__ = "routes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False
    )

    source_latitude = Column(
        Float,
        nullable=False
    )

    source_longitude = Column(
        Float,
        nullable=False
    )

    destination_latitude = Column(
        Float,
        nullable=False
    )

    destination_longitude = Column(
        Float,
        nullable=False
    )

    distance = Column(
        Float,
        nullable=False
    )

    estimated_time = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    trip = relationship(
        "Trip",
        back_populates="route"
    )

    def __repr__(self) -> str:
        return (
            f"<Route("
            f"id={self.id}, "
            f"trip_id={self.trip_id}, "
            f"distance={self.distance})>"
        )