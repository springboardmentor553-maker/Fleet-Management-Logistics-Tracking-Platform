from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
)

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)


# ============================================================
# REGISTER USER
# ============================================================

def register_user(
    user: UserCreate,
    db: Session
):
    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password before storing it
    hashed_password = hash_password(user.password)

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN USER
# ============================================================

def login_user(
    user: UserLogin,
    db: Session
):
    # Find user by email
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    # User does not exist
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    password_valid = verify_password(
        user.password,
        db_user.password
    )

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT access token
    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# GET PROFILE
# ============================================================

def get_profile(
    current_user: User
):
    return current_user


# ============================================================
# UPDATE PROFILE
# ============================================================

def update_profile(
    profile: UserUpdate,
    current_user: User,
    db: Session
):
    # Check if another user already has the new email
    if profile.email != current_user.email:

        existing_user = (
            db.query(User)
            .filter(
                User.email == profile.email,
                User.id != current_user.id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Update current user
    current_user.name = profile.name
    current_user.email = profile.email
    current_user.role = profile.role

    db.commit()
    db.refresh(current_user)

    return current_user