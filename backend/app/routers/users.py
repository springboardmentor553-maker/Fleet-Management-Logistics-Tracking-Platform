from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    return db.query(models.User).all()


@router.put("/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(user_id: int, payload: schemas.UpdateUserRoleRequest, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user