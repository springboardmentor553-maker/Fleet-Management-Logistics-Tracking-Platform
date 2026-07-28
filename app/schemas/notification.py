from pydantic import BaseModel
from datetime import datetime

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True