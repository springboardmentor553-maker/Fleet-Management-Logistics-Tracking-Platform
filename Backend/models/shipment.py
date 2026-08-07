import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELAYED = "DELAYED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"



class Shipment(Base):

    __tablename__ = "shipments"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    tracking_number = Column(
        String,
        unique=True,
        nullable=False
    )


    sender_name = Column(
        String,
        nullable=False
    )


    receiver_name = Column(
        String,
        nullable=False
    )


    pickup_location = Column(
        String,
        nullable=False
    )


    delivery_location = Column(
        String,
        nullable=False
    )


    status = Column(
        Enum(ShipmentStatus, name="shipmentstatus"),
        nullable=False,
        default=ShipmentStatus.CREATED
    )


    weight = Column(
        Float,
        nullable=False
    )
    current_location = Column(
        String,
        nullable=True
    )
    delivery_date = Column(
        DateTime,
        nullable=True
    )
    delivery_notes = Column(
        String,
        nullable=True
    )




    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    driver_id = Column(
        Integer,
        ForeignKey("drivers.id")
    )


    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id")
    )


    driver = relationship(
        "Driver",
        back_populates="shipments"
    )


    vehicle = relationship(
        "Vehicle",
        back_populates="shipments"
    )
    trips = relationship(
    "Trip",
    back_populates="shipment"
    )