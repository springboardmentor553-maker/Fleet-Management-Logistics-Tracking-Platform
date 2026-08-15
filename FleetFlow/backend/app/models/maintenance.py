from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    maintenance_category = Column(
        String,
        nullable=False
    )

    service_date = Column(
        Date,
        nullable=False
    )

    next_service_date = Column(
        Date,
        nullable=True
    )

    service_cost = Column(
        Float,
        nullable=False
    )

    service_provider = Column(
        String,
        nullable=False
    )

    maintenance_status = Column(
        String,
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_records"
    )