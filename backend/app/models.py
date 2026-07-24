from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from app.database import Base
from datetime import datetime

from app.enums import ShipmentStatus
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)

    trips = relationship("Trip", back_populates="driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Available")

    fuel_type = Column(String, nullable=False)
    fuel_level = Column(Float, default=100.0)
    fuel_status = Column(String, nullable=False)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)

    trips = relationship("Trip", back_populates="vehicle")





class Shipment(Base):
    __tablename__ = "shipments"

    shipment_id = Column(Integer, primary_key=True, index=True)

    shipment_type = Column(String, nullable=False)
    weight = Column(Float, nullable=False)

    driver_id = Column(Integer, ForeignKey("drivers.driver_id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))

    eta = Column(String, nullable=True)
    tracking_number = Column(String, unique=True, nullable=False)
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)

    created_date = Column(DateTime, default=datetime.utcnow)

    current_status = Column(
        Enum(
            ShipmentStatus,
            values_callable=lambda obj: [e.value for e in obj]
        ),
        default=ShipmentStatus.CREATED.value,
        nullable=False
    )

    trip = relationship(
        "Trip",
        back_populates="shipment",
        uselist=False
    )

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(Integer, ForeignKey("shipments.shipment_id"))
    driver_id = Column(Integer, ForeignKey("drivers.driver_id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))

    pickup_location = Column(String)
    destination = Column(String)

    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    destination_latitude = Column(Float)
    destination_longitude = Column(Float)

    scheduled_start_time = Column(DateTime)
    scheduled_end_time = Column(DateTime)

    trip_status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")