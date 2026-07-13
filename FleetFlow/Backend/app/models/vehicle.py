from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, nullable=False, index=True)
    vehicle_type = Column(String, nullable=False)          # Truck, Van, Bike, etc.
    model = Column(String, nullable=False)
    capacity_kg = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)             # Petrol, Diesel, Electric, CNG
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    current_status = Column(String, default="available")  # available, in_transit, maintenance
    latitude   = Column(Float, nullable=True)
    longitude  = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_driver = relationship("Driver", foreign_keys=[assigned_driver_id])
    shipments = relationship("Shipment", back_populates="vehicle")
