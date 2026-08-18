from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app import models
from app.database import get_db


router = APIRouter()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


ROLE_TO_DB = {
    "Admin": "admin",
    "User": "dispatcher",
    "Dispatcher": "dispatcher",
    "Manager": "manager",
    "Driver": "driver",
    "admin": "admin",
    "user": "dispatcher",
    "dispatcher": "dispatcher",
    "manager": "manager",
    "driver": "driver",
}


DB_TO_FRONTEND_ROLE = {
    "admin": "Admin",
    "dispatcher": "User",
    "manager": "Manager",
    "driver": "Driver",
}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def status_to_db(status):
    if isinstance(status, bool):
        return status

    if status is None:
        return True

    value = str(status).strip().lower()

    if value in ("inactive", "false", "disabled"):
        return False

    return True


def user_to_response(user):
    role_value = (
        user.role.value
        if hasattr(user.role, "value")
        else str(user.role)
    )

    return {
        "id": user.id,
        "username": user.full_name or "",
        "email": user.email,
        "role": DB_TO_FRONTEND_ROLE.get(
            role_value,
            role_value.title(),
        ),
        "status": (
            "Active"
            if user.is_active
            else "Inactive"
        ),
    }


@router.get("/")
def get_users(
    db: Session = Depends(get_db),
):
    users = (
        db.query(models.User)
        .order_by(models.User.id)
        .all()
    )

    return [
        user_to_response(user)
        for user in users
    ]


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user_to_response(user)


@router.post("/")
def create_user(
    data: dict,
    db: Session = Depends(get_db),
):
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username is required",
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required",
        )

    existing = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    role = ROLE_TO_DB.get(
        data.get("role", "User"),
        "dispatcher",
    )

    user = models.User(
        full_name=username,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        is_active=status_to_db(
            data.get("status", "Active")
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user_to_response(user)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if "username" in data:
        user.full_name = data["username"]

    if "email" in data:
        existing = (
            db.query(models.User)
            .filter(
                models.User.email == data["email"],
                models.User.id != user_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already exists",
            )

        user.email = data["email"]

    if data.get("password"):
        user.hashed_password = hash_password(
            data["password"]
        )

    if "role" in data:
        user.role = ROLE_TO_DB.get(
            data["role"],
            "dispatcher",
        )

    if "status" in data:
        user.is_active = status_to_db(
            data["status"]
        )

    db.commit()
    db.refresh(user)

    return user_to_response(user)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }