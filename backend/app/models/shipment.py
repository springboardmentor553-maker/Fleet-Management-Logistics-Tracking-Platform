from sqlalchemy import Column, Integer, String
from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, nullable=False)