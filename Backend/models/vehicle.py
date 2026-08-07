from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)

    vehicle_number = Column(String, unique=True)

    vehicle_type = Column(String)
    

    model = Column(String)

    capacity = Column(Integer)
    

    status =  Column(String, nullable=False,default="Available")
    
    shipments = relationship(
    "Shipment",
    back_populates="vehicle"
    )
    routes = relationship(
    "Route",
    back_populates="vehicle"
    )
    trips = relationship(
    "Trip",
    back_populates="vehicle"
    )
    maintenance_records = relationship(
        "Maintenance",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )
    assignments = relationship(
    "DriverAssignment",
    back_populates="vehicle"
    )
    maintenance_alerts = relationship(
    "MaintenanceAlert",
    back_populates="vehicle",
    cascade="all, delete-orphan"
)
    fuel_records = relationship(
    "FuelRecord",
    back_populates="vehicle",
    cascade="all, delete-orphan"
)