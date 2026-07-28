from sqlalchemy import Column, Integer, String
from app.database import Base
from sqlalchemy.orm import relationship

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)

    vehicle_number = Column(String, unique=True)

    vehicle_type = Column(String)
    

    model = Column(String)

    capacity = Column(Integer)
    

    status =  Column(String, nullable=False)
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