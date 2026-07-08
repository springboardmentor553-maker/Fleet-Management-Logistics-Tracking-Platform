from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    phone_number = Column(String, unique=True, nullable=False)
    license_number = Column(String, unique=True, nullable=False)

    status = Column(String, default="Available")
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="driver")

    vehicle = relationship(
        "Vehicle",
        back_populates="driver",
        uselist=False
    )