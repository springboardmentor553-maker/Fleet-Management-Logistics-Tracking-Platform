from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class NotificationCreate(BaseModel):
    user_id:        Optional[int] = None
    title:          str
    message:        str
    category:       str = "push"
    channel_email:  bool = False
    channel_sms:    bool = False
    channel_push:   bool = True
    priority:       str = "normal"
    reference_id:   Optional[int] = None
    reference_type: Optional[str] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    priority: Optional[str] = None


class NotificationResponse(BaseModel):
    id:             int
    user_id:        Optional[int]
    title:          str
    message:        str
    category:       str
    channel_email:  bool
    channel_sms:    bool
    channel_push:   bool
    is_read:        bool
    priority:       str
    reference_id:   Optional[int]
    reference_type: Optional[str]
    created_at:     datetime
    read_at:        Optional[datetime]

    model_config = {"from_attributes": True}


class NotificationSummary(BaseModel):
    total:      int
    unread:     int
    by_category: dict
