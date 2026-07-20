from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database import SessionLocal

from app.schemas.notification import NotificationResponse

from app.services.notification_service import (

    get_notifications,

    get_latest_notifications,

    mark_as_read,

    delete_notification,

    mark_all_as_read,

    clear_all_notifications

)

router = APIRouter(

    prefix="/notifications",

    tags=["Notifications"]

)


def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


@router.get(

    "/",

    response_model=list[NotificationResponse]

)

def fetch_notifications(

    db: Session = Depends(get_db)

):

    return get_notifications(db)


@router.get(

    "/latest",

    response_model=list[NotificationResponse]

)

def latest_notifications(

    db: Session = Depends(get_db)

):

    return get_latest_notifications(db)


# =====================================
# Mark All Notifications as Read
# =====================================

@router.put("/read-all")

def read_all_notifications(

    db: Session = Depends(get_db)

):

    return mark_all_as_read(db)


# =====================================
# Clear All Notifications
# =====================================

@router.delete("/clear-all")

def delete_all_notifications(

    db: Session = Depends(get_db)

):

    return clear_all_notifications(db)

@router.put(

    "/{notification_id}/read"

)

def read_notification(

    notification_id: int,

    db: Session = Depends(get_db)

):

    return mark_as_read(

        notification_id,

        db

    )


@router.delete(

    "/{notification_id}"

)

def remove_notification(

    notification_id: int,

    db: Session = Depends(get_db)

):

    return delete_notification(

        notification_id,

        db

    )

