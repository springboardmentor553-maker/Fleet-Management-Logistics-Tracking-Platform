from enum import Enum
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.utils.dependencies import get_current_user


class Role(str, Enum):
    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    DRIVER = "driver"
    DISPATCHER = "dispatcher"


def require_roles(*roles: Role):
    """Returns a dependency that enforces the current user has one of the given roles."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return checker
