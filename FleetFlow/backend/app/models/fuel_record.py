from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship

from app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

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
        String,
        nullable=False
    )

    remarks = Column(
        Text,
        nullable=True
    )

    vehicle = relationship(
        "Vehicle"
    )

    driver = relationship(
        "Driver"
    )