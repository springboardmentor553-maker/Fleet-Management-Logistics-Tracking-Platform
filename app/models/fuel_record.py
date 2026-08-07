from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    fuel_date = Column(DateTime, nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=True)
    fuel_station = Column(String(100), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle")