from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if system generated
    action = Column(String(50), nullable=False) # e.g. "CREATE", "UPDATE", "DELETE"
    resource_type = Column(String(50), nullable=False) # e.g. "Trip", "Shipment"
    resource_id = Column(Integer, nullable=True) # Optional: if applying to a specific item
    details = Column(JSONB, nullable=True) # Payload details, changes made, etc.
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
