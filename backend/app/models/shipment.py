from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy import Enum
from app.enums import ShipmentStatus
from sqlalchemy.orm import relationship

from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, nullable=False)
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)

    status = Column(
        Enum(ShipmentStatus),
        nullable=False,
        default=ShipmentStatus.CREATED
    )

    weight = Column(Float, nullable=False)

    created_date = Column(DateTime, default=datetime.utcnow)

    assigned_driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True
    )

    assigned_vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True
    )

    trip = relationship(
        "Trip",
        back_populates="shipment",
        uselist=False
    )