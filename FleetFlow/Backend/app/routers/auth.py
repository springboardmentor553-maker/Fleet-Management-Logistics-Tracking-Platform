from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth import register_user, login_user
from app.utils.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return register_user(data, db)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return login_user(data, db)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
