from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class FuelLog(Base):
    """
    SQLAlchemy model representing a fuel log entry.
    """
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    
    fuel_date = Column(DateTime(timezone=True), nullable=False)
    fuel_quantity = Column(Float, nullable=False) # liters
    fuel_cost = Column(Float, nullable=False)
    fuel_price_per_liter = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_station = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")
    driver = relationship("Driver", back_populates="fuel_logs")

    def __repr__(self) -> str:
        return f"<FuelLog(id={self.id}, vehicle_id={self.vehicle_id}, quantity={self.fuel_quantity}, cost={self.fuel_cost})>"
