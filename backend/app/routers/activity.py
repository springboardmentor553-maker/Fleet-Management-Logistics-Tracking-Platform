from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog


router = APIRouter(
    prefix="/activities",
    tags=["Audit Logs"]
)


# =====================================================
# GET ALL AUDIT LOGS
# =====================================================

@router.get("/")
def get_audit_logs(
    db: Session = Depends(get_db),
    module: str | None = Query(default=None),
    action: str | None = Query(default=None),
    username: str | None = Query(default=None),
):

    query = db.query(AuditLog)

    # Filter by module
    if module:
        query = query.filter(
            AuditLog.module == module
        )

    # Filter by action
    if action:
        query = query.filter(
            AuditLog.action == action
        )

    # Filter by username
    if username:
        query = query.filter(
            AuditLog.username == username
        )

    logs = (
        query
        .order_by(AuditLog.id.desc())
        .all()
    )

    return logs


# =====================================================
# GET SINGLE AUDIT LOG
# =====================================================

@router.get("/{audit_id}")
def get_audit_log(
    audit_id: int,
    db: Session = Depends(get_db)
):

    log = (
        db.query(AuditLog)
        .filter(AuditLog.id == audit_id)
        .first()
    )

    if not log:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return log