from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    Token,
)

from app.services.auth_service import (
    register_user,
    login_user,
    get_profile,
    update_profile,
)

# Import BOTH from the same file
from app.utils.dependencies import (
    get_db,
    get_current_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ==========================================
# REGISTER
# ==========================================

@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    return register_user(user, db)


# ==========================================
# LOGIN
# ==========================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    return login_user(user, db)


# ==========================================
# GET PROFILE
# ==========================================

@router.get(
    "/profile",
    response_model=UserResponse,
)
def profile(
    current_user: User = Depends(get_current_user),
):
    return get_profile(current_user)


# ==========================================
# UPDATE PROFILE
# ==========================================

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_user_profile(
    profile: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(
        profile,
        current_user,
        db,
    )