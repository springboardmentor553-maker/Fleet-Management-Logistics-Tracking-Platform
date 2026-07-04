from sqlalchemy import Column, Integer, String
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Integer)
    status = Column(String, default="Available")