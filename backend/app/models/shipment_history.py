from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from backend.app.database import Base


class ShipmentHistory(Base):
    __tablename__ = "shipment_history"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(
        Integer,
        ForeignKey("shipments.id")
    )

    status = Column(String)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow
    )