from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from backend.app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    status = Column(String, default="Available")
    created_at = Column(DateTime, default=datetime.utcnow)