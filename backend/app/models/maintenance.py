from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    maintenance_category = Column(
        String,
        nullable=False
    )

    service_date = Column(Date)

    next_service_date = Column(Date)

    service_cost = Column(Float, default=0)

    service_provider = Column(String)

    status = Column(
        String,
        default="Scheduled"
    )

    notes = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Soft delete (never delete history)
    is_active = Column(
        Integer,
        default=1
    )