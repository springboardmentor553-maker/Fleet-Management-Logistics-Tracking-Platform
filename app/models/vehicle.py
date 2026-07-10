from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    fuel_type = Column(String(30), nullable=False)
    status = Column(String(50), default="Available")

    driver_id = Column(Integer, ForeignKey("drivers.id"))

    driver = relationship(
        "Driver",
        back_populates="vehicle"
    )

    shipments = relationship(
        "Shipment",
        back_populates="vehicle"
    )