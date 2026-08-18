import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class DriverStatus(str, enum.Enum):
    """
    Enum representing status of a driver.
    """

    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    INACTIVE = "inactive"


class Driver(Base):
    """
    SQLAlchemy model representing a driver.
    """

    __tablename__ = "drivers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )
    name = Column(
        String(100),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        unique=True,
        nullable=True
    )

    license_number = Column(
        String(100),
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=False
    )
    phone_number = Column(
        String(20),
        nullable=False
    )

    # ---------------------------------------------------
    # Driver Status
    # ---------------------------------------------------
    #
    # IMPORTANT:
    # The existing database stores lowercase values:
    #
    # available
    # on_trip
    # off_duty
    # inactive
    #
    # values_callable tells SQLAlchemy to use the enum
    # VALUES instead of the enum MEMBER NAMES.
    #

    status = Column(
        Enum(
            DriverStatus,
            name="driver_status",
            native_enum=False,
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
            validate_strings=True,
        ),
        default=DriverStatus.AVAILABLE,
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

    # ---------------------------------------------------
    # Relationships
    # ---------------------------------------------------

    user = relationship(
        "User",
        back_populates="driver"
    )

    shipments = relationship(
        "Shipment",
        back_populates="driver"
    )

    fuel_logs = relationship(
        "FuelLog",
        back_populates="driver"
    )

    assignments = relationship(
        "DriverAssignment",
        back_populates="driver"
    )

    attendance_records = relationship(
        "DriverAttendance",
        back_populates="driver"
    )

    trips = relationship(
        "Trip",
        back_populates="driver"
    )

    def __repr__(self) -> str:
        return (
            f"<Driver("
            f"id={self.id}, "
            f"license_number='{self.license_number}', "
            f"status='{self.status}')>"
        )