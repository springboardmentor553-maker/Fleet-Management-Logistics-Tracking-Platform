from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
)

from sqlalchemy.sql import func

from app.database import Base


# ==========================================================
# FUEL RECORD MODEL
# ==========================================================

class FuelRecord(Base):

    __tablename__ = "fuel_records"

    # ======================================================
    # PRIMARY KEY
    # ======================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ======================================================
    # VEHICLE
    # ======================================================

    vehicle_id = Column(
        Integer,
        ForeignKey(
            "vehicles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ======================================================
    # TRIP
    # ======================================================

    trip_id = Column(
        Integer,
        ForeignKey(
            "trips.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # ======================================================
    # FUEL CONSUMED
    # ======================================================

    fuel_consumed_liters = Column(
        Float,
        nullable=False,
    )

    # ======================================================
    # DISTANCE
    # ======================================================

    distance_km = Column(
        Float,
        nullable=False,
    )

    # ======================================================
    # ODOMETER
    # ======================================================

    odometer_km = Column(
        Float,
        nullable=True,
    )

    # ======================================================
    # FUEL TYPE
    # ======================================================

    fuel_type = Column(
        String(30),
        nullable=True,
    )

    # ======================================================
    # NOTES
    # ======================================================

    notes = Column(
        String(500),
        nullable=True,
    )

    # ======================================================
    # CREATED DATE
    # ======================================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )