"""Vehicle model."""

from sqlalchemy import Column, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import VehicleStatusEnum


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)
    current_status = Column(
        Enum(VehicleStatusEnum, name="vehiclestatusenum"),
        default=VehicleStatusEnum.AVAILABLE,
        nullable=False,
    )

    # Foreign Keys: Vehicle belongs to a manager (User) and a primary Driver
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

    # Back-references
    manager = relationship("User", back_populates="managed_vehicles")
    driver = relationship("Driver", back_populates="vehicles")

    # 1-to-Many: One Vehicle → many Shipments
    shipments = relationship("Shipment", back_populates="vehicle")

    # 1-to-Many: One Vehicle → many Trips over time
    trips = relationship("Trip", back_populates="vehicle")
