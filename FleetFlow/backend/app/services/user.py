from sqlalchemy.orm import Session
from app.models.user import User
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate
from app.auth.hashing import hash_password
from app.auth.hashing import verify_password
from app.auth.jwt_handler import create_access_token


def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()    

def get_users(db: Session):
    return db.query(User).all()

def update_user(db: Session, user_id: int, user: UserCreate):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    db_user.username = user.username
    db_user.email = user.email
    db_user.password_hash = hash_password(user.password)
    db_user.role = user.role

    db.commit()
    db.refresh(db_user)

    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    db.delete(db_user)
    db.commit()

    return db_user

def login_user(
    db: Session,
    form_data: OAuth2PasswordRequestForm
):

    db_user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if db_user is None:
        return None

    if not verify_password(
        form_data.password,
        db_user.password_hash
    ):
        return None

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