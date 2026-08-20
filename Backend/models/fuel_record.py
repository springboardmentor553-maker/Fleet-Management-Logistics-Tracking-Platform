from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    fuel_quantity = Column(
        Float,
        nullable=False
    )

    fuel_cost = Column(
        Float,
        nullable=False
    )

    odometer_reading = Column(
        Float,
        nullable=False
    )

    fuel_date = Column(
        Date,
        nullable=False
    )

    fuel_station = Column(
        String(150),
        nullable=False
    )

    remarks = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    # Relationships
    vehicle = relationship(
        "Vehicle",
        back_populates="fuel_records"
    )

    driver = relationship(
        "Driver",
        back_populates="fuel_records"
    )