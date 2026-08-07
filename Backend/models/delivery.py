from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    receiver_name = Column(String, nullable=False)
    receiver_phone = Column(String, nullable=False)
    delivery_status = Column(String, default="Pending")
    remarks = Column(String)

    shipment = relationship("Shipment")