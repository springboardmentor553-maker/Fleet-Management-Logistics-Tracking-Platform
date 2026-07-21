from sqlalchemy import Column, Integer, String, ForeignKey, Date
from app.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    maintenance_type = Column(String, nullable=False)

    scheduled_date = Column(Date)

    completed_date = Column(Date, nullable=True)

    status = Column(String, default="Scheduled")

    remarks = Column(String, nullable=True)