from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    user_id: int | None = None
    action: str
    resource_type: str
    resource_id: int | None = None
    details: dict[str, Any] | None = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
