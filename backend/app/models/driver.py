# from sqlalchemy import Column, Integer, String
# from sqlalchemy.orm import relationship

# from app.database import Base


# class Driver(Base):
#     __tablename__ = "drivers"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String(100), nullable=False)
#     license_number = Column(String(100), unique=True, nullable=False)
#     phone = Column(String(20), nullable=False)
#     status = Column(String(50), default="Available")

#     vehicle = relationship(
#         "Vehicle",
#         back_populates="driver",
#         uselist=False
#     )

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    license_number = Column(String(100), unique=True, nullable=False)

    phone = Column(String(20), nullable=False)

    status = Column(String(50), default="Available")

    # One Driver -> Many Vehicles
    vehicle = relationship(
        "Vehicle",
        back_populates="driver"
    )

    # One Driver -> Many Shipments
    shipments = relationship(
        "Shipment",
        back_populates="driver"
    )
    trips = relationship(
    "Trip",
    back_populates="driver"
    )