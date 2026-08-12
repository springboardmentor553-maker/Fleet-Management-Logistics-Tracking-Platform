from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    fuel_quantity = Column(Float, nullable=False)  # Liters
    fuel_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    fuel_station = Column(String, nullable=False)
    remarks = Column(String, nullable=True)

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
