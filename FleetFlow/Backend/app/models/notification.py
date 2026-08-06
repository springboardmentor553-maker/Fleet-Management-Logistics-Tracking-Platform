from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)   # None = broadcast
    title         = Column(String,  nullable=False)
    message       = Column(Text,    nullable=False)

    # Category: maintenance_alert | delivery | driver_assignment |
    #           shipment_status   | route_change | email | sms | push
    category      = Column(String,  nullable=False, default="push")

    # Channels (flags)
    channel_email = Column(Boolean, default=False)
    channel_sms   = Column(Boolean, default=False)
    channel_push  = Column(Boolean, default=True)

    is_read       = Column(Boolean, default=False)
    priority      = Column(String,  default="normal")  # low | normal | high | critical
    reference_id  = Column(Integer, nullable=True)     # FK to related entity (trip, shipment, etc.)
    reference_type= Column(String,  nullable=True)     # "trip" | "shipment" | "driver" | "maintenance"
    created_at    = Column(DateTime, default=datetime.utcnow)
    read_at       = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
