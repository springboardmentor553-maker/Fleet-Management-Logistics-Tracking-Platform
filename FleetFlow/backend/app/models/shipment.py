from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True
    )

    origin = Column(String, nullable=False)

    destination = Column(String, nullable=False)

    status = Column(String, default="Created")

    eta = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship(
        "Vehicle",
        back_populates="shipments"
    )