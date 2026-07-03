import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """
    Enum representing roles for users in the FleetFlow system.
    """
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    MANAGER = "manager"
    DRIVER = "driver"


class User(Base):
    """
    SQLAlchemy model representing a user.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(
        Enum(UserRole, name="user_role", native_enum=True),
        default=UserRole.DISPATCHER,
        nullable=False
    )
    is_active = Column(Boolean, default=True, nullable=False)
    
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

    # One-to-one relationship with Driver
    driver = relationship(
        "Driver",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
