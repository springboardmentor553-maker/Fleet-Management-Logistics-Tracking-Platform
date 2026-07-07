from sqlalchemy import Column, Integer, String
from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    driver_id = Column(Integer, nullable=True)
    vehicle_id = Column(Integer, nullable=True)