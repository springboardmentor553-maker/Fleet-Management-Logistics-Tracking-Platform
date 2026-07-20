"""Driver model."""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_details = Column(String, nullable=False)

    # Back-reference to User
    user = relationship("User", back_populates="driver_profile")

    # 1-to-Many: One Driver → many Vehicles over time
    vehicles = relationship("Vehicle", back_populates="driver")

    # 1-to-Many: One Driver → many Shipments
    shipments = relationship("Shipment", back_populates="driver")

    # 1-to-Many: One Driver → many Trips over time
    trips = relationship("Trip", back_populates="driver")
