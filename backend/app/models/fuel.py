from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Date,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import relationship

from app.database import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

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

    fuel_date = Column(
        Date,
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
        Integer,
        nullable=False
    )

    fuel_station = Column(
        String,
        nullable=False
    )

    remarks = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    is_active = Column(
        Integer,
        default=1
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="fuel_logs"
    )

    driver = relationship(
        "Driver",
        back_populates="fuel_logs"
    )