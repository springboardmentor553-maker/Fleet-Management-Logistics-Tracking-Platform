from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from datetime import datetime

from app.utils.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate, NotificationUpdate,
    NotificationResponse, NotificationSummary,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

VALID_CATEGORIES = {
    "maintenance_alert", "delivery", "driver_assignment",
    "shipment_status", "route_change", "email", "sms", "push"
}
VALID_PRIORITIES = {"low", "normal", "high", "critical"}


# ── POST /notifications/ ─────────────────────────────────────────────────────
@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
    if data.priority not in VALID_PRIORITIES:
        raise HTTPException(400, f"Invalid priority. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}")

    # Validate target user exists if specified
    if data.user_id:
        if not db.query(User).filter(User.id == data.user_id).first():
            raise HTTPException(404, "Target user not found")

    notif = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        category=data.category,
        channel_email=data.channel_email,
        channel_sms=data.channel_sms,
        channel_push=data.channel_push,
        priority=data.priority,
        reference_id=data.reference_id,
        reference_type=data.reference_type,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


# ── GET /notifications/ ──────────────────────────────────────────────────────
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    category:  Optional[str] = None,
    is_read:   Optional[bool] = None,
    priority:  Optional[str] = None,
    limit:     int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    )
    if category:
        query = query.filter(Notification.category == category)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if priority:
        query = query.filter(Notification.priority == priority)
    return query.order_by(Notification.id.desc()).limit(limit).all()


# ── GET /notifications/summary ───────────────────────────────────────────────
@router.get("/summary", response_model=NotificationSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    )
    total, unread_count = base.with_entities(
        func.count(Notification.id),
        func.count(case((Notification.is_read == False, 1))),
    ).first()

    rows = (
        base.with_entities(Notification.category, func.count(Notification.id))
        .group_by(Notification.category)
        .all()
    )
    by_cat = {cat: cnt for cat, cnt in rows}

    return NotificationSummary(
        total=total or 0,
        unread=unread_count or 0,
        by_category=by_cat,
    )


# ── GET /notifications/{id} ──────────────────────────────────────────────────
@router.get("/{notif_id}", response_model=NotificationResponse)
def get_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    return n


# ── PATCH /notifications/{id}/read ───────────────────────────────────────────
@router.patch("/{notif_id}/read", response_model=NotificationResponse)
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    n.read_at = datetime.utcnow()
    db.commit()
    db.refresh(n)
    return n


# ── PATCH /notifications/read-all ────────────────────────────────────────────
@router.patch("/read-all/bulk", status_code=status.HTTP_200_OK)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    updated = (
        db.query(Notification)
        .filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None),
            Notification.is_read == False,
        )
        .update({"is_read": True, "read_at": now}, synchronize_session=False)
    )
    db.commit()
    return {"message": f"Marked {updated} notification(s) as read"}


# ── DELETE /notifications/{id} ───────────────────────────────────────────────
@router.delete("/{notif_id}", status_code=status.HTTP_200_OK)
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
    return {"message": f"Notification #{notif_id} deleted"}


# ── DELETE /notifications/clear/all ──────────────────────────────────────────
@router.delete("/clear/all", status_code=status.HTTP_200_OK)
def clear_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = (
        db.query(Notification)
        .filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"message": f"Cleared {deleted} notification(s)"}
