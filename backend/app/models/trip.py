import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class TripStatus(str, enum.Enum):
    """
    Enum representing status of a trip.
    """
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Trip(Base):
    """
    SQLAlchemy model representing a trip.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    pickup_location = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    scheduled_start_time = Column(DateTime(timezone=True), nullable=False)
    scheduled_end_time = Column(DateTime(timezone=True), nullable=False)
    
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    destination_latitude = Column(Float, nullable=True)
    destination_longitude = Column(Float, nullable=True)
    
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    
    distance_km = Column(Float, nullable=True)
    estimated_duration = Column(String(255), nullable=True)
    route_summary = Column(String(500), nullable=True)
    route_geometry = Column(JSON, nullable=True)
    
    location_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    trip_status = Column(
        Enum(TripStatus, name="trip_status", native_enum=True),
        default=TripStatus.CREATED,
        nullable=False
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    shipment = relationship("Shipment", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    driver_assignments = relationship("DriverAssignment", back_populates="trip", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="trip")

    def __repr__(self) -> str:
        return f"<Trip(id={self.id}, shipment_id={self.shipment_id}, trip_status='{self.trip_status}')>"
