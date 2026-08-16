from enum import Enum
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def _make_json_safe(obj: Any) -> Any:
    """Recursively convert Python Enum instances to their .value so the
    dict is JSON-serializable for the JSONB column."""
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, dict):
        return {k: _make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_make_json_safe(v) for v in obj]
    return obj


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    user_id: int | None = None,
    details: dict[str, Any] | None = None
) -> AuditLog:
    """
    Log a business event to the audit_logs table.
    """
    audit_log = AuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        details=_make_json_safe(details) if details else details
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log

