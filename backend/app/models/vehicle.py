from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_number = Column(String, unique=True, nullable=False)

    vehicle_type = Column(String, nullable=False)

    capacity = Column(String)

    status = Column(String, default="Available")

    # One Vehicle → Many Trips
    trips = relationship(
        "Trip",
        back_populates="vehicle"
    )
    fuel_records = relationship(
    "Fuel",
    back_populates="vehicle"
)