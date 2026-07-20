from sqlalchemy.orm import Session

from app.models.notification import Notification

from datetime import datetime, timezone
def create_notification(

    db: Session,

    title: str,

    message: str,

    type: str = "info"

):
    notification = Notification(

    title=title,

    message=message,

    type=type,

    created_at=datetime.now(timezone.utc)

    )

    db.add(notification)

    db.commit()

    db.refresh(notification)

    return notification


def get_notifications(db: Session):

    return (

        db.query(Notification)

        .order_by(Notification.created_at.desc())

        .all()

    )


def get_latest_notifications(db: Session):

    return (

        db.query(Notification)

        .order_by(Notification.created_at.desc())

        .limit(5)

        .all()

    )


def mark_as_read(notification_id: int, db: Session):

    notification = (

        db.query(Notification)

        .filter(Notification.id == notification_id)

        .first()

    )

    if notification:

        notification.is_read = True

        db.commit()

        db.refresh(notification)

    return notification


def delete_notification(notification_id: int, db: Session):

    notification = (

        db.query(Notification)

        .filter(Notification.id == notification_id)

        .first()

    )

    if notification:

        db.delete(notification)

        db.commit()

    return {

        "message": "Notification deleted"

    }


# =====================================
# Mark All Notifications as Read
# =====================================

def mark_all_as_read(db: Session):

    notifications = db.query(Notification).filter(
        Notification.is_read == False
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read."
    }


# =====================================
# Clear All Notifications
# =====================================

def clear_all_notifications(db: Session):

    db.query(Notification).delete()

    db.commit()

    return {
        "message": "All notifications cleared."
    }