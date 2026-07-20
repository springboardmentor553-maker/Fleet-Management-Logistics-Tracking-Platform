# from sqlalchemy import Column, Integer, String, ForeignKey
# from sqlalchemy.orm import relationship

# from app.database import Base


# class Shipment(Base):
#     __tablename__ = "shipments"

#     id = Column(Integer, primary_key=True, index=True)
#     shipment_name = Column(String(100), nullable=False)
#     source = Column(String(100), nullable=False)
#     destination = Column(String(100), nullable=False)
#     status = Column(String(50), default="Created")

#     vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

#     vehicle = relationship(
#         "Vehicle",
#         back_populates="shipments"
#     )

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Shipment(Base):

    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    tracking_number = Column(String, unique=True, nullable=False)

    sender_name = Column(String, nullable=False)

    receiver_name = Column(String, nullable=False)

    pickup_location = Column(String, nullable=False)

    delivery_location = Column(String, nullable=False)

    current_status = Column(String, default="Created")

    weight = Column(Float)

    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    assigned_driver_id = Column(
        Integer,
        ForeignKey("drivers.id")
    )

    assigned_vehicle_id = Column(
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
    trip = relationship(
    "Trip",
    back_populates="shipment",
    uselist=False
 )