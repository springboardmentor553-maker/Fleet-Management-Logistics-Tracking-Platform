from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from backend.app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float, nullable=False)
    status = Column(String, default="Available")
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Available")