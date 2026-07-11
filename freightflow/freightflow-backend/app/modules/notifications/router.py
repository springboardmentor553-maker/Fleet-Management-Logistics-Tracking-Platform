from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_account
from app.db.session import get_db
from app.modules.accounts.models import Account
from app.modules.notifications import service
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
def list_my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current: Account = Depends(get_current_account),
) -> list[Notification]:
    return service.list_for_account(db, current.id, unread_only)


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current: Account = Depends(get_current_account),
) -> Notification:
    return service.mark_read(db, notification_id, current.id)
