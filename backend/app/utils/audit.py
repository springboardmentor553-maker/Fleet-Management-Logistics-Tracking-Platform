from app.models.audit_log import AuditLog


def create_audit_log(
    db,
    user,
    module,
    action,
    details
):
    """
    Create an audit log for the currently logged-in user.
    """

    audit = AuditLog(
        user_id=user.get("id"),
        username=user.get("username"),
        module=module,
        action=action,
        details=details
    )

    db.add(audit)

    return audit