from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.common.enums import NotificationCategory


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message: str
    category: NotificationCategory
    is_read: bool
    created_at: datetime
