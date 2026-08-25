from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    fleet_manager = "fleet_manager"
    driver = "driver"
    dispatcher = "dispatcher"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.driver)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    photo_url = Column(String, nullable=True)
    notification_frequency = Column(String, default="instant")  # instant, daily, off


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float)
    fuel_type = Column(String)
    status = Column(String, default="available")
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", back_populates="vehicle")
    trips = relationship("Trip", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    phone = Column(String)
    status = Column(String, default="active")
    experience_years = Column(Integer, nullable=True)
    attendance_percentage = Column(Float, nullable=True, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="driver", uselist=False)
    trips = relationship("Trip", back_populates="driver")

class ShipmentStatus(str, enum.Enum):
    created = "created"
    assigned = "assigned"
    picked_up = "picked_up"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    delayed = "delayed"
    delivered = "delivered"
    cancelled = "cancelled"


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String, unique=True, nullable=False)
    sender_name = Column(String, nullable=True)
    receiver_name = Column(String, nullable=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    weight = Column(Float, nullable=True)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.created)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    eta = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    trip = relationship("Trip", back_populates="shipment", uselist=False)

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True, unique=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled")  # scheduled, ongoing, completed, cancelled
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shipment = relationship("Shipment", back_populates="trip")
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")

class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, default="FleetFlow")
    logo_url = Column(String, nullable=True)


class MaintenanceCategory(str, enum.Enum):
    oil_change = "oil_change"
    tyre_replacement = "tyre_replacement"
    brake_service = "brake_service"
    engine_service = "engine_service"
    general_inspection = "general_inspection"


class MaintenanceStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Maintenance(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    category = Column(Enum(MaintenanceCategory), nullable=False)
    service_date = Column(DateTime, nullable=False)
    next_service_date = Column(DateTime, nullable=True)
    service_cost = Column(Float, nullable=True)
    service_provider = Column(String, nullable=True)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.scheduled)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", backref="maintenance_records")


class AssignmentStatus(str, enum.Enum):
    assigned = "assigned"
    completed = "completed"
    cancelled = "cancelled"


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)  # optional — an
    # assignment can exist before a trip is created (e.g. daily duty assignment)
    assignment_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.assigned)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", backref="assignments")
    vehicle = relationship("Vehicle", backref="assignments")
    trip = relationship("Trip", backref="assignment", uselist=False)


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    leave = "leave"


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", backref="attendance_records")


class AlertType(str, enum.Enum):
    due_soon = "due_soon"
    overdue = "overdue"


class AlertStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    completed = "completed"


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    maintenance_id = Column(Integer, ForeignKey("maintenance_records.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)
    message = Column(String, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.pending)
    next_service_date = Column(DateTime(timezone=True), nullable=True)
    is_read = Column(Boolean, default=False)  # kept for the existing Notifications UI
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    maintenance = relationship("Maintenance", backref="alerts")
    vehicle = relationship("Vehicle", backref="maintenance_alerts")


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    fuel_quantity = Column(Float, nullable=False)  # in liters
    fuel_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=True)
    fuel_date = Column(DateTime(timezone=True), nullable=False)
    fuel_station = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", backref="fuel_records")
    driver = relationship("Driver", backref="fuel_records")