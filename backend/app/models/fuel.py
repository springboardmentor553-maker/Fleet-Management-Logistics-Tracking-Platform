from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Fuel(Base):

    __tablename__ = "fuel_records"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # FOREIGN KEY
    # =====================================================

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    # =====================================================
    # FUEL DETAILS
    # =====================================================

    fuel_date = Column(
        Date,
        nullable=False
    )

    liters = Column(
        Float,
        nullable=False
    )

    cost = Column(
        Float,
        nullable=False
    )

    odometer = Column(
        Integer,
        nullable=False
    )

    fuel_station = Column(
        String,
        nullable=False
    )

    # =====================================================
    # RELATIONSHIP
    # =====================================================

    vehicle = relationship(
        "Vehicle",
        back_populates="fuel_records"
    )