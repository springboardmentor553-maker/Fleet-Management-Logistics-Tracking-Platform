from sqlalchemy import Column, Integer, String

from app.database import Base


class Driver(Base):
	__tablename__ = "drivers"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False)
	license_number = Column(String(100), unique=True, nullable=False)
	phone = Column(String(20), nullable=False)
	status = Column(String(50), default="Available")
