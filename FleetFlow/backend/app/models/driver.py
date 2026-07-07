from sqlalchemy import Column, Integer, String
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    status = Column(String, nullable=False, default="active")