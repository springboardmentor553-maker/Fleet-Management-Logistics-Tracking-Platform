from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)

    vehicles = relationship("Vehicle", back_populates="user")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)

    shipments = relationship("Shipment", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    capacity = Column(Float, nullable=False)
    fuel_type = Column(String(30), nullable=False)
    status = Column(String(30), default="Available")

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="vehicles")
    shipments = relationship("Shipment", back_populates="vehicle")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    status = Column(String(30), default="Pending")
    eta = Column(String(50))

    driver_id = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    driver = relationship("Driver", back_populates="shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")