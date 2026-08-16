
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.services.security import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=list[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    resource_type: str = Query(None),
    action: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)
        
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
