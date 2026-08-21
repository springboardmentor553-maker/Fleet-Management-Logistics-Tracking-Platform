from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    get_current_user,
)

from app.models.user import User
from app.models.notification import Notification


router = APIRouter()


# ============================================================
# GET MY NOTIFICATIONS
# ============================================================

@router.get("/")
def get_notifications(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),

):

    notifications = (

        db.query(
            Notification
        )

        .filter(
            Notification.user_id
            ==
            current_user.id
        )

        .order_by(
            Notification.created_at.desc()
        )

        .limit(50)

        .all()

    )


    return [

        {

            "id":
                item.id,

            "title":
                item.title,

            "message":
                item.message,

            "notification_type":
                item.notification_type,

            "related_entity":
                item.related_entity,

            "related_id":
                item.related_id,

            "is_read":
                item.is_read,

            "created_at":
                item.created_at,

        }

        for item in notifications

    ]


# ============================================================
# UNREAD COUNT
# ============================================================

@router.get(
    "/unread-count"
)
def get_unread_count(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),

):

    count = (

        db.query(
            Notification
        )

        .filter(

            Notification.user_id
            ==
            current_user.id,

            Notification.is_read.is_(
                False
            ),

        )

        .count()

    )


    return {
        "count": count
    }


# ============================================================
# MARK ONE AS READ
# ============================================================

@router.put(
    "/{notification_id}/read"
)
def mark_notification_read(

    notification_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),

):

    notification = (

        db.query(
            Notification
        )

        .filter(

            Notification.id
            ==
            notification_id,

            Notification.user_id
            ==
            current_user.id,

        )

        .first()

    )


    if notification is None:

        raise HTTPException(

            status_code=404,

            detail=
                "Notification not found.",

        )


    notification.is_read = True

    db.commit()


    return {
        "message":
            "Notification marked as read."
    }


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.put(
    "/read-all"
)
def mark_all_notifications_read(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),

):

    (

        db.query(
            Notification
        )

        .filter(

            Notification.user_id
            ==
            current_user.id,

            Notification.is_read.is_(
                False
            ),

        )

        .update(

            {
                Notification.is_read:
                    True
            },

            synchronize_session=False,

        )

    )


    db.commit()


    return {
        "message":
            "All notifications marked as read."
    }