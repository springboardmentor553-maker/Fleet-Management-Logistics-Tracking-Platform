import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RouteStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    CLOSED = "CLOSED"


class Route(Base):
    __tablename__ = "routes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    route_name = Column(
        String,
        nullable=False
    )

    source = Column(
        String,
        nullable=False
    )

    destination = Column(
        String,
        nullable=False
    )

    distance = Column(
        Float,
        nullable=False
    )

    estimated_time = Column(
        String,
        nullable=False
    )

    status = Column(
        Enum(RouteStatus, name="routestatus"),
        default=RouteStatus.ACTIVE,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="routes"
    )

    driver = relationship(
        "Driver",
        back_populates="routes"
    )

    trips = relationship(
    "Trip",
    back_populates="route"
    )