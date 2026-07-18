# Models package for database schema/table definitions
import enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    IN_TRANSIT = "In Transit"
    DELAYED = "Delayed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class TripStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


# Trip statuses that count as "the driver/vehicle is currently busy"
ACTIVE_TRIP_STATUSES = (TripStatus.SCHEDULED, TripStatus.IN_PROGRESS)


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

    shipments = relationship(
        "Shipment", back_populates="vehicle", foreign_keys="Shipment.assigned_vehicle_id"
    )
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")
    trips = relationship("Trip", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    status = Column(String, nullable=False, default="available")

    shipments = relationship(
        "Shipment", back_populates="driver", foreign_keys="Shipment.assigned_driver_id"
    )
    trips = relationship("Trip", back_populates="driver")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float)
    estimated_duration_hours = Column(Float)


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, nullable=False, index=True)
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)
    status = Column(
        SAEnum(ShipmentStatus, name="shipment_status", native_enum=False, length=20),
        nullable=False,
        default=ShipmentStatus.CREATED,
    )
    weight = Column(Float)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"))
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    vehicle = relationship(
        "Vehicle", back_populates="shipments", foreign_keys=[assigned_vehicle_id]
    )
    driver = relationship(
        "Driver", back_populates="shipments", foreign_keys=[assigned_driver_id]
    )
    trip = relationship("Trip", back_populates="shipment", uselist=False)


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), unique=True, nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    pickup_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    scheduled_start_time = Column(DateTime(timezone=True), nullable=True)
    scheduled_end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        SAEnum(TripStatus, name="trip_status", native_enum=False, length=20),
        nullable=False,
        default=TripStatus.SCHEDULED,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")


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
