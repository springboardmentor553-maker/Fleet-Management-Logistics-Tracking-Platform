from datetime import datetime

from app.schemas.common import ORMModel


class NotificationBase(ORMModel):

    title: str

    message: str

    status: str | None = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(ORMModel):

    title: str | None = None

    message: str | None = None

    status: str | None = None


class NotificationRead(NotificationBase):

    id: int

    created_at: datetime