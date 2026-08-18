# Models package for database schema/table definitions
import enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ShipmentStatus(str, enum.Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    PICKED_UP = "Picked Up"
    IN_TRANSIT = "In Transit"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"
    DELAYED = "Delayed"
    CANCELLED = "Cancelled"


class MaintenanceCategory(str, enum.Enum):
    OIL_CHANGE = "Oil Change"
    TYRE_REPLACEMENT = "Tyre Replacement"
    BRAKE_SERVICE = "Brake Service"
    ENGINE_SERVICE = "Engine Service"
    GENERAL_INSPECTION = "General Inspection"


class TripStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


ACTIVE_TRIP_STATUSES = (TripStatus.SCHEDULED, TripStatus.IN_PROGRESS)


class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"


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
    fuel_records = relationship("FuelRecord", back_populates="vehicle")
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
    assignments = relationship("DriverAssignment", back_populates="driver")
    attendance_records = relationship("DriverAttendance", back_populates="driver")
    fuel_records = relationship("FuelRecord", back_populates="driver")


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
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), index=True)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), index=True)

    vehicle = relationship(
        "Vehicle", back_populates="shipments", foreign_keys=[assigned_vehicle_id]
    )
    driver = relationship(
        "Driver", back_populates="shipments", foreign_keys=[assigned_driver_id]
    )
    trip = relationship("Trip", back_populates="shipment", uselist=False)

    @property
    def customer_name(self):
        return self.sender_name

    @customer_name.setter
    def customer_name(self, value):
        self.sender_name = value
        self.receiver_name = value

    @property
    def source(self):
        return self.pickup_location

    @source.setter
    def source(self, value):
        self.pickup_location = value

    @property
    def destination(self):
        return self.delivery_location

    @destination.setter
    def destination(self, value):
        self.delivery_location = value



class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), unique=True, nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    pickup_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    destination_latitude = Column(Float, nullable=True)
    destination_longitude = Column(Float, nullable=True)
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
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    category = Column(String, nullable=False, default=MaintenanceCategory.GENERAL_INSPECTION)
    service_date = Column(Date, nullable=False)
    next_service_date = Column(Date, nullable=True)
    cost = Column(Float, nullable=True)
    service_provider = Column(String, nullable=True)
    status = Column(String, nullable=False, default="scheduled")
    notes = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Integer, nullable=False, default=0)

    vehicle = relationship("Vehicle", back_populates="maintenance_records")
    alerts = relationship("MaintenanceAlert", back_populates="maintenance_record")


class MaintenanceAlertStatus(str, enum.Enum):
    PENDING = "Pending"
    SENT = "Sent"
    COMPLETED = "Completed"


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    maintenance_id = Column(Integer, ForeignKey("maintenance_records.id"), nullable=False, index=True)
    alert_message = Column(Text, nullable=False)
    alert_type = Column(String, nullable=False, default="Upcoming Service")
    alert_status = Column(
        String,
        nullable=False,
        default=MaintenanceAlertStatus.PENDING,
    )
    generated_date = Column(DateTime(timezone=True), server_default=func.now())
    next_service_date = Column(Date, nullable=True)

    vehicle = relationship("Vehicle")
    maintenance_record = relationship("MaintenanceRecord", back_populates="alerts")



class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    liters = Column(Float, nullable=False)
    cost_per_liter = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, nullable=True)
    log_date = Column(Date, nullable=False)
    fuel_station = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="fuel_records")
    driver = relationship("Driver", back_populates="fuel_records")

    @property
    def fuel_quantity(self):
        return self.liters

    @fuel_quantity.setter
    def fuel_quantity(self, value):
        self.liters = value

    @property
    def fuel_cost(self):
        return self.total_cost

    @fuel_cost.setter
    def fuel_cost(self, value):
        self.total_cost = value

    @property
    def fuel_date(self):
        return self.log_date

    @fuel_date.setter
    def fuel_date(self, value):
        self.log_date = value


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String, nullable=False, default="info")
    is_read = Column(Integer, nullable=False, default=0)


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    assignment_date = Column(DateTime(timezone=True), server_default=func.now())
    assignment_status = Column(String, nullable=False, default="Assigned")
    remarks = Column(Text, nullable=True)

    driver = relationship("Driver", back_populates="assignments")
    vehicle = relationship("Vehicle")
    trip = relationship("Trip")


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    date = Column(Date, nullable=False)
    attendance_status = Column(
        SAEnum(AttendanceStatus, name="attendance_status", native_enum=False, length=20),
        nullable=False,
        default=AttendanceStatus.PRESENT,
    )
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)

    driver = relationship("Driver", back_populates="attendance_records")