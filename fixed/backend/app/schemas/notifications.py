from app.schemas.common import ORMModel


class NotificationBase(ORMModel):
    title: str
    message: str
    level: str = "info"
    is_read: int = 0


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(ORMModel):
    title: str | None = None
    message: str | None = None
    level: str | None = None
    is_read: int | None = None


class NotificationRead(NotificationBase):
    id: int
