from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    service_date = Column(Date, nullable=False)

    description = Column(Text, nullable=False)

    cost = Column(Float, nullable=True)

    status = Column(
        String,
        nullable=False,
        default="scheduled"
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_records"
    )

    def __repr__(self):
        return (
            f"<MaintenanceRecord("
            f"id={self.id}, "
            f"vehicle_id={self.vehicle_id}, "
            f"status='{self.status}')>"
        )