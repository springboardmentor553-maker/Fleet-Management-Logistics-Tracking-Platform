from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)


def register_user(user: UserCreate, db: Session):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(user: UserLogin, db: Session):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

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


# =====================================
# GET PROFILE
# =====================================

def get_profile(

    current_user: User

):

    return current_user


# =====================================
# UPDATE PROFILE
# =====================================

def update_profile(
    profile: UserUpdate,
    current_user: User,
    db: Session,
):

    # Attach the object to the current session
    user = db.merge(current_user)

    user.name = profile.name
    user.email = profile.email
    user.role = profile.role

    db.commit()
    db.refresh(user)

    return user