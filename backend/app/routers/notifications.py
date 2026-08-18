from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

from app.schemas.notifications import (
    NotificationCreate,
    NotificationRead,
    NotificationUpdate,
)

from app.routers.crud import build_crud_router


# =========================================================
# ROUTER
# =========================================================

router = APIRouter()


# =========================================================
# LATEST NOTIFICATIONS
# =========================================================

@router.get(
    "/latest",
    response_model=list[NotificationRead],
)
def get_latest_notifications(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Notification)
        .order_by(
            models.Notification.created_at.desc()
        )
        .limit(10)
        .all()
    )


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

@router.put(
    "/{notification_id}/read",
    response_model=NotificationRead,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.status = "Read"

    db.commit()
    db.refresh(notification)

    return notification


# =========================================================
# GENERIC CRUD
# =========================================================

crud_router = build_crud_router(
    model=models.Notification,
    create_schema=NotificationCreate,
    update_schema=NotificationUpdate,
    read_schema=NotificationRead,
)

router.include_router(crud_router)