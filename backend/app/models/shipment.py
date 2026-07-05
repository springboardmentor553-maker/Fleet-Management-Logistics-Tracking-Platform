from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_name = Column(String(100), nullable=False)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    status = Column(String(50), default="Created")

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    vehicle = relationship(
        "Vehicle",
        back_populates="shipments"
    )