from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base

# Enums based on project roles and statuses
class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    FLEET_MANAGER = "FLEET_MANAGER"
    DRIVER = "DRIVER"
    DISPATCHER = "DISPATCHER"

class VehicleStatusEnum(enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    MAINTENANCE = "MAINTENANCE"

class ShipmentStatusEnum(enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class TripStatusEnum(enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

# --- MODELS ---

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum, name="roleenum"), nullable=False)
    
    # 1-to-1 Relationship: User to Driver Profile (uselist=False enforces 1:1)
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    
    # 1-to-Many Relationship: One Manager (User) can manage multiple Vehicles
    managed_vehicles = relationship("Vehicle", back_populates="manager")

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_details = Column(String, nullable=False)
    
    # Back-reference to User
    user = relationship("User", back_populates="driver_profile")
    
    # 1-to-Many Relationship: One Driver can drive multiple Vehicles over time
    vehicles = relationship("Vehicle", back_populates="driver")
    
    # 1-to-Many Relationship: One Driver handles multiple Shipments
    shipments = relationship("Shipment", back_populates="driver")
    
    # 1-to-Many Relationship: One Driver can have many Trips over time
    trips = relationship("Trip", back_populates="driver")

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
    
    # Foreign Keys linking Vehicle to User(Manager) and Driver
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    # Back-references
    manager = relationship("User", back_populates="managed_vehicles")
    driver = relationship("Driver", back_populates="vehicles")
    
    # 1-to-Many Relationship: One Vehicle carries multiple Shipments
    shipments = relationship("Shipment", back_populates="vehicle")
    
    # 1-to-Many Relationship: One Vehicle can be used across many Trips over time
    trips = relationship("Trip", back_populates="vehicle")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    # Auto-generated tracking number, e.g. FLT100001
    tracking_number = Column(String, unique=True, nullable=False, index=True)

    # Sender / Receiver information
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)

    # Locations
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)

    # Shipment status
    status = Column(
        Enum(ShipmentStatusEnum, name="shipmentstatusenum"),
        default=ShipmentStatusEnum.CREATED,
        nullable=False,
    )

    # Cargo details
    weight = Column(Float, nullable=False)  # in kg

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    eta = Column(DateTime, nullable=True)

    # Foreign Keys linking Shipment to Driver and Vehicle
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Back-references
    driver = relationship("Driver", back_populates="shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")
    
    # 1-to-1 Relationship: A Shipment belongs to at most one Trip
    trip = relationship("Trip", back_populates="shipment", uselist=False)


class Trip(Base):
    """Represents a single logistics trip that carries a shipment."""
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    # UNIQUE ensures a shipment can belong to at most one trip
    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Trip logistics details
    pickup_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    # Coordinates – populated by the geocoding service
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)

    scheduled_start_time = Column(DateTime, nullable=False)
    scheduled_end_time = Column(DateTime, nullable=True)


    # Status
    status = Column(
        Enum(TripStatusEnum, name="tripstatusenum"),
        default=TripStatusEnum.SCHEDULED,
        nullable=False,
    )

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")