from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.modules.accounts.models import Account
from app.modules.accounts.schemas import AccountCreate, AccountUpdate


def get_account_by_email(db: Session, email: str) -> Account | None:
    return db.scalar(select(Account).where(Account.email == email))


def get_account_or_404(db: Session, account_id: int) -> Account:
    account = db.get(Account, account_id)
    if account is None:
        raise NotFoundError(f"Account {account_id} was not found")
    return account


def list_accounts(db: Session, offset: int, limit: int) -> tuple[list[Account], int]:
    items = db.scalars(select(Account).order_by(Account.id).offset(offset).limit(limit)).all()
    total = db.scalar(select(func.count()).select_from(Account)) or 0
    return list(items), total


def register_account(db: Session, payload: AccountCreate) -> Account:
    if get_account_by_email(db, payload.email):
        raise ConflictError("An account with this email already exists")
    account = Account(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update_account(db: Session, account_id: int, payload: AccountUpdate) -> Account:
    account = get_account_or_404(db, account_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


def deactivate_account(db: Session, account_id: int) -> None:
    account = get_account_or_404(db, account_id)
    account.is_active = False
    db.commit()


def authenticate(db: Session, email: str, password: str) -> Account:
    account = get_account_by_email(db, email)
    if account is None or not verify_password(password, account.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not account.is_active:
        raise UnauthorizedError("This account has been deactivated")
    return account


def issue_tokens(account: Account) -> tuple[str, str]:
    return (
        create_access_token(account.id, account.role.value),
        create_refresh_token(account.id),
    )


def refresh_access_token(db: Session, refresh_token: str) -> str:
    try:
        claims = decode_token(refresh_token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid refresh token") from exc
    if claims.get("type") != "refresh":
        raise UnauthorizedError("Token is not a refresh token")
    account = get_account_or_404(db, int(claims["sub"]))
    return create_access_token(account.id, account.role.value)
