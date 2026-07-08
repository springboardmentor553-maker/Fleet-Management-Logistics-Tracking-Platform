from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.database import get_db
from backend.app.schemas.auth import UserRegister, UserLogin
from backend.app.models.user import User
from backend.app.utils.security import hash_password, verify_password
from backend.app.utils.jwt_handler import create_access_token

router = APIRouter()


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
    }
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        return {"message": "Invalid Email"}

    if not verify_password(
        form_data.password,
        db_user.password
    ):
        return {"message": "Invalid Password"}

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