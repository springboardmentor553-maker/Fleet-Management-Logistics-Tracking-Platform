from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole
from app.common.pagination import Page, PageParams
from app.core.deps import get_current_account, require_roles
from app.db.session import get_db
from app.modules.accounts import service
from app.modules.accounts.models import Account
from app.modules.accounts.schemas import (
    AccountCreate,
    AccountOut,
    AccountUpdate,
    LoginRequest,
    RefreshRequest,
    TokenPair,
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
accounts_router = APIRouter(prefix="/accounts", tags=["User Management"])


@auth_router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    account = service.authenticate(db, payload.email, payload.password)
    access_token, refresh_token = service.issue_tokens(account)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@auth_router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    new_access_token = service.refresh_access_token(db, payload.refresh_token)
    return TokenPair(access_token=new_access_token, refresh_token=payload.refresh_token)


@accounts_router.get("/me", response_model=AccountOut)
def read_my_profile(current: Account = Depends(get_current_account)) -> Account:
    return current


@accounts_router.post(
    "",
    response_model=AccountOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(AccountRole.ADMIN))],
)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)) -> Account:
    return service.register_account(db, payload)


@accounts_router.get(
    "",
    response_model=Page[AccountOut],
    dependencies=[Depends(require_roles(AccountRole.ADMIN))],
)
def list_accounts(params: PageParams = Depends(), db: Session = Depends(get_db)) -> Page[AccountOut]:
    items, total = service.list_accounts(db, params.offset, params.page_size)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@accounts_router.patch(
    "/{account_id}",
    response_model=AccountOut,
    dependencies=[Depends(require_roles(AccountRole.ADMIN))],
)
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)) -> Account:
    return service.update_account(db, account_id, payload)


@accounts_router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(AccountRole.ADMIN))],
)
def deactivate_account(account_id: int, db: Session = Depends(get_db)) -> None:
    service.deactivate_account(db, account_id)
