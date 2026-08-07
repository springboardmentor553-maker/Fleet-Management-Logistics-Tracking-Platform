from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# Register API
# -------------------------

@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    # Check existing email

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


    # Create new user

    new_user = User(
    full_name=user.full_name,
    email=user.email,
    password=hash_password(user.password),
    role=user.role,
    is_active=True
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    return {

        "message": "User registered successfully",

        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role
        }

    }



# -------------------------
# Login API
# -------------------------

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # Find user by email

    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )


    if not db_user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # Verify password

    if not verify_password(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # Create JWT token

    access_token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )


    return {

        "access_token": access_token,

        "token_type": "bearer"

    }
