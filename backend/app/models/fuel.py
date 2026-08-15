from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class FuelRecord(Base):
    """
    SQLAlchemy model representing a fuel record.
    """
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    fuel_date = Column(DateTime(timezone=True), nullable=False)
    fuel_quantity = Column(Float, nullable=False)
    fuel_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_station = Column(String(100), nullable=True)
    fuel_type = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
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
    vehicle = relationship("Vehicle", back_populates="fuel_records")
    trip = relationship("Trip")

    def __repr__(self) -> str:
        return f"<FuelRecord(id={self.id}, vehicle_id={self.vehicle_id}, quantity={self.fuel_quantity}, cost={self.fuel_cost})>"
