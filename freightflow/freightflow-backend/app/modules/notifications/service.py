from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import NotificationCategory
from app.common.exceptions import NotFoundError
from app.modules.notifications.models import Notification


def notify(db: Session, account_id: int, message: str, category: NotificationCategory) -> Notification:
    notification = Notification(account_id=account_id, message=message, category=category)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_for_account(db: Session, account_id: int, unread_only: bool = False) -> list[Notification]:
    query = select(Notification).where(Notification.account_id == account_id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    query = query.order_by(Notification.created_at.desc())
    return list(db.scalars(query).all())


def mark_read(db: Session, notification_id: int, account_id: int) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.account_id != account_id:
        raise NotFoundError("Notification was not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
