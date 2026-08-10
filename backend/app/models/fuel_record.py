from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    fuel_quantity = Column(Float, nullable=False)
    fuel_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_date = Column(Date, nullable=False)
    fuel_station = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

    vehicle = relationship("Vehicle", back_populates="fuel_records")
    driver = relationship("Driver", back_populates="fuel_records")
