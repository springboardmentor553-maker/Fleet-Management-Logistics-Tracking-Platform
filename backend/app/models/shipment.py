from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from backend.app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, default="Pending")

    driver_id = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    created_at = Column(DateTime, default=datetime.utcnow)