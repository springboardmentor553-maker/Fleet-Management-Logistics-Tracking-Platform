from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check whether email already exists
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    # -----------------------------------------------------
    # Validate role
    # -----------------------------------------------------

    allowed_roles = [
        "admin",
        "manager",
        "user",
        "driver"
    ]

    role = user.role.lower().strip()

    if role not in allowed_roles:

        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )


    # -----------------------------------------------------
    # IMPORTANT:
    # Hash password BEFORE storing it in database
    # -----------------------------------------------------

    hashed_password = hash_password(
        user.password
    )


    # -----------------------------------------------------
    # Create user
    # -----------------------------------------------------

    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=role
    )


    # -----------------------------------------------------
    # Save to database
    # -----------------------------------------------------

    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )


    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # -----------------------------------------------------
    # Verify password
    #
    # Plain password entered by user is compared with
    # the HASH stored in database.
    # -----------------------------------------------------

    password_valid = verify_password(
        user.password,
        db_user.password
    )


    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # -----------------------------------------------------
    # Create JWT
    # -----------------------------------------------------

    token = create_access_token(
        {
            "user_id": db_user.id,
            "sub": db_user.email,
            "username": db_user.username,
            "role": db_user.role
        }
    )


    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "access_token": token,
        "token_type": "bearer",

        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role
        }
    }