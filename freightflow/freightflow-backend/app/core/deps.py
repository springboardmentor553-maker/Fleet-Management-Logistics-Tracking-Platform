from collections.abc import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.common.enums import AccountRole
from app.common.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.modules.accounts.models import Account

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_account(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Account:
    if token is None:
        raise UnauthorizedError("Authentication credentials were not provided")
    try:
        claims = decode_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid or expired access token") from exc
    if claims.get("type") != "access":
        raise UnauthorizedError("Token is not an access token")

    account = db.get(Account, int(claims["sub"]))
    if account is None or not account.is_active:
        raise UnauthorizedError("Account no longer exists or is inactive")
    return account


def require_roles(*allowed_roles: AccountRole) -> Callable[[Account], Account]:
    def _guard(account: Account = Depends(get_current_account)) -> Account:
        if account.role not in allowed_roles:
            raise ForbiddenError("You do not have permission to perform this action")
        return account

    return _guard
