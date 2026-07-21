from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    tracking_id = Column(String, unique=True, nullable=False)

    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)

    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    current_location = Column(String, default="Warehouse")

    status = Column(
        String,
        default="Pending"
    )

    # One Shipment -> One Trip
    trip = relationship(
        "Trip",
        back_populates="shipment",
        uselist=False
    )