from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

_admin_only = require_roles(Role.ADMIN)


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(_admin_only)):
    return db.query(User).all()


@router.patch("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(_admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(_admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_role(user_id: int, role: str, db: Session = Depends(get_db), _: User = Depends(_admin_only)):
    valid = {"admin", "fleet_manager", "driver", "dispatcher"}
    if role not in valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"role must be one of {sorted(valid)}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user
