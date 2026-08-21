from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    module: str,
    action: str,
    details: str,
    user_id: int = None,
    username: str = None
):
    """
    Create an audit log entry.
    """

    log = AuditLog(
        user_id=user_id,
        username=username,
        module=module,
        action=action,
        details=details
    )

    db.add(log)

    return log
