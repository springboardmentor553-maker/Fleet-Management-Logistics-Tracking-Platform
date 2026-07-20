from datetime import datetime

from pydantic import BaseModel


class NotificationCreate(BaseModel):

    title: str

    message: str

    type: str = "info"


class NotificationResponse(BaseModel):

    id: int

    title: str

    message: str

    type: str

    is_read: bool

    created_at: datetime

    class Config:

        from_attributes = True