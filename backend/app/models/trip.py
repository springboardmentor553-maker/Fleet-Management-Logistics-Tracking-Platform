from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import DateTime
from datetime import datetime


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)

    start_location = Column(String, nullable=False)
    end_location = Column(String, nullable=False)

    departure_time = Column(String)
    expected_arrival = Column(String)

    current_latitude = Column(String)
    current_longitude = Column(String)

    destination_latitude = Column(String)
    destination_longitude = Column(String)

    status = Column(String, default="Scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    shipment = relationship("Shipment", back_populates="trip")
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")

   