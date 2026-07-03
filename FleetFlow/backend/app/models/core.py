from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base

# Enums based on project roles and statuses
class RoleEnum(enum.Enum):
    ADMIN = "Administrator" #
    MANAGER = "Fleet Manager" #
    DRIVER = "Driver" #
    DISPATCHER = "Dispatcher" #

class VehicleStatusEnum(enum.Enum):
    AVAILABLE = "Available"
    IN_USE = "In Use"
    MAINTENANCE = "Maintenance"

class ShipmentStatusEnum(enum.Enum):
    CREATED = "Created" #
    ASSIGNED = "Assigned" #
    IN_TRANSIT = "In Transit" #
    DELAYED = "Delayed" #
    DELIVERED = "Delivered" #
    CANCELLED = "Cancelled" #

# --- MODELS ---

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    
    # 1-to-1 Relationship: User to Driver Profile (uselist=False enforces 1:1)
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    
    # 1-to-Many Relationship: One Manager (User) can manage multiple Vehicles
    managed_vehicles = relationship("Vehicle", back_populates="manager")

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    license_details = Column(String, nullable=False) #
    
    # Back-reference to User
    user = relationship("User", back_populates="driver_profile")
    
    # 1-to-Many Relationship: One Driver can drive multiple Vehicles over time
    vehicles = relationship("Vehicle", back_populates="driver")
    
    # 1-to-Many Relationship: One Driver handles multiple Shipments
    shipments = relationship("Shipment", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False) #
    vehicle_type = Column(String, nullable=False) #
    capacity = Column(Float, nullable=False) #
    fuel_type = Column(String, nullable=False) #
    current_status = Column(Enum(VehicleStatusEnum), default=VehicleStatusEnum.AVAILABLE) #
    
    # Foreign Keys linking Vehicle to User(Manager) and Driver
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True) #
    
    # Back-references
    manager = relationship("User", back_populates="managed_vehicles")
    driver = relationship("Driver", back_populates="vehicles")
    
    # 1-to-Many Relationship: One Vehicle carries multiple Shipments
    shipments = relationship("Shipment", back_populates="vehicle")

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(ShipmentStatusEnum), default=ShipmentStatusEnum.CREATED)
    created_at = Column(DateTime, default=datetime.utcnow)
    eta = Column(DateTime, nullable=True) #
    
    # Foreign Keys linking Shipment to Driver and Vehicle
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    # Back-references
    driver = relationship("Driver", back_populates="shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")