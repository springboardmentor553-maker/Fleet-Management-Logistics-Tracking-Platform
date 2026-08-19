from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.database import get_db
from backend.app.schemas.auth import UserRegister
from backend.app.models.user import User
from backend.app.utils.security import hash_password, verify_password
from backend.app.utils.jwt_handler import create_access_token

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    email_clean = user.email.strip().lower()

    # Check if user with email already exists (case-insensitive)
    existing_user = db.query(User).filter(
        func.lower(User.email) == email_clean
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name.strip() if user.name else "",
        email=email_clean,
        password=hashed_password,
        role=user.role.strip() if user.role else "Driver"
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception:
        db.rollback()
        raise

    return {
        "message": "User Registered Successfully"
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email_clean = form_data.username.strip().lower() if form_data.username else ""
    db_user = db.query(User).filter(
        func.lower(User.email) == email_clean
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address",
        )

    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }