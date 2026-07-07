from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(String, nullable=False)

    fuel_type = Column(String, nullable=False)
    fuel_level = Column(Float, default=100.0)
    fuel_status = Column(String, nullable=False)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    shipment_type = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    status = Column(String, nullable=False)

    driver_id = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    eta = Column(String, nullable=True)