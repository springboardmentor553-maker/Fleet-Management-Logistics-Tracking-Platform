from app import models
from app.routers.crud import build_crud_router
from app.schemas.notifications import (
    NotificationCreate,
    NotificationRead,
    NotificationUpdate,
)

router = build_crud_router(
    model=models.Notification,
    create_schema=NotificationCreate,
    update_schema=NotificationUpdate,
    read_schema=NotificationRead,
)
