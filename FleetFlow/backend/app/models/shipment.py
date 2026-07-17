from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey
)
from app.enums.shipment_status import ShipmentStatus
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True
    )

    tracking_number = Column(String, unique=True, nullable=False)

    sender_name = Column(String, nullable=False)

    receiver_name = Column(String, nullable=False)

    pickup_location = Column(String, nullable=False)

    delivery_location = Column(String, nullable=False)

    current_status = Column(
        String,
        default=ShipmentStatus.CREATED.value,
        nullable=False
    )

    weight = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    driver = relationship(
        "Driver",
    )
    
    vehicle = relationship(
        "Vehicle",
        back_populates="shipments"
    )
