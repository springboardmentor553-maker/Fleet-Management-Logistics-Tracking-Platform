from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class FuelRecordModel(Base):
    """
    SQLAlchemy model representing a fuel record.
    Named FuelRecordModel to avoid conflict with the legacy FuelRecord if it exists in memory.
    """
    __tablename__ = "fleet_fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    fuel_quantity = Column(Float, nullable=False)
    fuel_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_date = Column(DateTime(timezone=True), nullable=False)
    fuel_station = Column(String(150), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="fleet_fuel_records")
    driver = relationship("Driver", back_populates="fleet_fuel_records")

    def __repr__(self) -> str:
        return f"<FuelRecordModel(id={self.id}, vehicle_id={self.vehicle_id}, quantity={self.fuel_quantity}, cost={self.fuel_cost})>"
