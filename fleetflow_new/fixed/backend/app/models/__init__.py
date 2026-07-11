# Models package for database schema/table definitions
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="manager")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False, index=True)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float)
    status = Column(String, nullable=False, default="available")
    current_location = Column(String)

    shipments = relationship("Shipment", back_populates="vehicle")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    status = Column(String, nullable=False, default="available")

    shipments = relationship("Shipment", back_populates="driver")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float)
    estimated_duration_hours = Column(Float)

    shipments = relationship("Shipment", back_populates="route")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    cargo_description = Column(Text)
    weight = Column(Float)
    status = Column(String, nullable=False, default="pending")
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    route_id = Column(Integer, ForeignKey("routes.id"))

    vehicle = relationship("Vehicle", back_populates="shipments")
    driver = relationship("Driver", back_populates="shipments")
    route = relationship("Route", back_populates="shipments")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Float)
    status = Column(String, nullable=False, default="scheduled")

    vehicle = relationship("Vehicle", back_populates="maintenance_records")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String, nullable=False, default="info")
    is_read = Column(Integer, nullable=False, default=0)
