"""User model."""

from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import RoleEnum


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum, name="roleenum"), nullable=False)

    # 1-to-1: User → Driver profile
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

    # 1-to-Many: One manager (User) → many Vehicles
    managed_vehicles = relationship("Vehicle", back_populates="manager")
