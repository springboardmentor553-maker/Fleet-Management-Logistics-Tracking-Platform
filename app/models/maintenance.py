from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_date = Column(Date, nullable=False)
    maintenance_type = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    status = Column(String, default="Scheduled")

    vehicle = relationship("Vehicle")