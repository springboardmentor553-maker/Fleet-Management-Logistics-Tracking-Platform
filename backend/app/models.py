import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Date, Time, UniqueConstraint
from app.database import Base
from datetime import datetime
from app.enums import ShipmentStatus
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.enums import MaintenanceCategory
from app.enums import AlertStatus,AttendanceStatus

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
    status = Column(String, nullable=False, default="Available")
    trips = relationship("Trip", back_populates="driver")
    assignments=relationship("DriverAssignment",back_populates="driver")
    attendance = relationship("DriverAttendance", back_populates="driver")
    fuel_records = relationship("FuelRecord",back_populates="driver")


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
    assignments=relationship("DriverAssignment",back_populates="vehicle")
    fuel_records = relationship("FuelRecord",back_populates="vehicle")
    maintenance_alerts = relationship("MaintenanceAlert",back_populates="vehicle")






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
    assignments=relationship("DriverAssignment",back_populates="trip")


class Maintenance(Base):
    __tablename__ = "maintenance"

    maintenance_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))
    maintenance_category = Column(Enum(MaintenanceCategory))

    service_date = Column(DateTime)
    next_service_date = Column(DateTime)

    service_cost = Column(Float)
    service_provider = Column(String)

    maintenance_status = Column(String)
    notes = Column(String)

    created_at = Column(DateTime, server_default=func.now())
    alerts = relationship("MaintenanceAlert",back_populates="maintenance")

class DriverAssignment(Base):
    __tablename__="driver_assignments"
    assignment_id=Column(Integer, primary_key=True, index=True)
    driver_id=Column(Integer, ForeignKey("drivers.driver_id"),nullable=False)
    vehicle_id=Column(Integer, ForeignKey("vehicles.vehicle_id"),nullable=False)
    trip_id=Column(Integer, ForeignKey("trips.id"),nullable=False)
    assignment_date=Column(DateTime, default=datetime.utcnow)
    assignment_status=Column(String,nullable=False)
    remarks=Column(String)
    driver=relationship("Driver",back_populates="assignments")
    vehicle=relationship("Vehicle",back_populates="assignments")
    trip=relationship("Trip",back_populates="assignments")

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"


class DriverAttendance(Base):
    __tablename__ = "driver_attendance"

    __table_args__ = (
        UniqueConstraint(
            "driver_id",
            "date",
            name="unique_driver_attendance_per_day"
        ),
    )

    attendance_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.driver_id"),
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )

    attendance_status = Column(
        Enum(AttendanceStatus),
        nullable=False
    )

    check_in_time = Column(Time)

    check_out_time = Column(Time)

    driver = relationship(
        "Driver",
        back_populates="attendance"
    )

class FuelRecord(Base):
    __tablename__ = "fuel_records"

    fuel_record_id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.vehicle_id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.driver_id"),
        nullable=False
    )

    fuel_quantity = Column(Float, nullable=False)

    fuel_cost = Column(Float, nullable=False)

    odometer_reading = Column(Float, nullable=False)

    fuel_date = Column(DateTime, default=datetime.utcnow)

    fuel_station = Column(String, nullable=False)

    remarks = Column(String)

    vehicle = relationship("Vehicle", back_populates="fuel_records")
    driver = relationship("Driver", back_populates="fuel_records")

class MaintenanceAlert(Base):
    __tablename__="maintenance_alerts"
    alert_id=Column(Integer, primary_key=True, index=True)
    vehicle_id=Column(Integer, ForeignKey("vehicles.vehicle_id"),nullable=False)
    maintenance_id=Column(Integer, ForeignKey("maintenance.maintenance_id"),nullable=False)
    alert_message=Column(String, nullable=False)
    alert_type=Column(String, nullable=False)
    alert_status = Column(Enum(AlertStatus),nullable=False,default=AlertStatus.PENDING)    
    generated_date=Column(DateTime, default=datetime.utcnow)
    next_service_date=Column(DateTime)
    vehicle=relationship("Vehicle", back_populates="maintenance_alerts")
    maintenance = relationship("Maintenance",back_populates="alerts")