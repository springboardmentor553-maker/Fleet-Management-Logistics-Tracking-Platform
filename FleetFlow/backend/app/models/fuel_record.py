"""FuelRecord model — Task 1."""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class FuelRecord(Base):
    """Tracks every refuelling event for a vehicle."""

    __tablename__ = "fuel_records"

    id               = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    vehicle_id       = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id        = Column(Integer, ForeignKey("drivers.id",  ondelete="SET NULL"), nullable=True,  index=True)

    # Fuel details
    fuel_quantity    = Column(Float,  nullable=False)           # litres
    fuel_cost        = Column(Float,  nullable=False)           # INR (or whatever currency)
    odometer_reading = Column(Float,  nullable=True)            # km at time of fill-up
    fuel_date        = Column(Date,   nullable=False, default=date.today)
    fuel_station     = Column(String, nullable=True)
    remarks          = Column(Text,   nullable=True)

    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    vehicle  = relationship("Vehicle", backref="fuel_records")
    driver   = relationship("Driver",  backref="fuel_records")
