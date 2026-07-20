from sqlalchemy.orm import Session

from app.services.notification_service import create_notification


def notify(

    db: Session,

    title: str,

    message: str,

    type="info"

):

    create_notification(

        db,

        title,

        message,

        type

    )