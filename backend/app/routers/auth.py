from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import RegisterRequest, LoginResponse
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    require_role,
)
from app.logs.logger import logger


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# TEST API
# ============================================================

@router.get("/")
def test_auth():
    return {
        "message": "Auth Router Working"
    }


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
def register(
    user: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=user.role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(
        f"New User Registered | "
        f"Name={new_user.full_name} | "
        f"Email={new_user.email} | "
        f"Role={new_user.role.value}"
    )

    return {
        "message": "User Registered Successfully",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value,
    }


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not db_user:
        logger.warning(
            f"Login Failed | "
            f"Email={form_data.username} | "
            f"Reason=Invalid Email"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid Email",
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    if not verify_password(
        form_data.password,
        db_user.hashed_password,
    ):
        logger.warning(
            f"Login Failed | "
            f"Email={db_user.email} | "
            f"Reason=Invalid Password"
        )

        failed_audit = AuditLog(
            user_email=db_user.email,
            action="Login",
            status="Failed",
        )

        db.add(failed_audit)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Invalid Password",
        )

    role_value = db_user.role.value

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": role_value,
        }
    )

    audit = AuditLog(
        user_email=db_user.email,
        action="Login",
        status="Success",
    )

    db.add(audit)
    db.commit()

    logger.info(
        f"User Logged In | "
        f"Name={db_user.full_name} | "
        f"Email={db_user.email} | "
        f"Role={role_value}"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_value,
        "full_name": db_user.full_name,
        "email": db_user.email,
    }


# ============================================================
# PROTECTED PROFILE
# ============================================================

@router.get("/profile")
def profile(
    user=Depends(verify_token),
):
    return {
        "message": "Protected Route",
        "user": user,
    }


# ============================================================
# ADMIN
# ============================================================

@router.get("/admin")
def admin_dashboard(
    user=Depends(require_role(["Admin"])),
):
    return {
        "message": "Welcome Admin",
        "user": user,
    }


# ============================================================
# FLEET MANAGER
# ============================================================

@router.get("/manager")
def manager_dashboard(
    user=Depends(require_role(["Fleet Manager"])),
):
    return {
        "message": "Welcome Fleet Manager",
        "user": user,
    }


# ============================================================
# DRIVER
# ============================================================

@router.get("/driver")
def driver_dashboard(
    user=Depends(require_role(["Driver"])),
):
    return {
        "message": "Welcome Driver",
        "user": user,
    }


# ============================================================
# DISPATCHER
# ============================================================

@router.get("/dispatcher")
def dispatcher_dashboard(
    user=Depends(require_role(["Dispatcher"])),
):
    return {
        "message": "Welcome Dispatcher",
        "user": user,
    }