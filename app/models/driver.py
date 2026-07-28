from sqlalchemy import Column, Integer, String
from app.database import Base
from sqlalchemy.orm import relationship

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    shipments = relationship(
        "Shipment",
        back_populates="driver"
    )
    routes = relationship(
        "Route",
        back_populates="driver"
    )

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True)

    phone = Column(String)

    license_number = Column(String, unique=True)

    experience = Column(Integer)

    status = Column(String)
    trips = relationship(
    "Trip",
    back_populates="driver"
)