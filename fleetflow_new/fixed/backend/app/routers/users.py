from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.crud import commit_or_409
from app.schemas.users import UserCreate, UserRead, UserUpdate
from app.utils.security import hash_password

router = APIRouter()


@router.get("/", response_model=list[UserRead])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.User).offset(skip).limit(limit).all()


@router.post("/", response_model=UserRead, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["password"] = hash_password(data["password"])
    user = models.User(**data)
    db.add(user)
    commit_or_409(db)
    db.refresh(user)
    return user


@router.get("/{item_id}", response_model=UserRead)
def get_user(item_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, item_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return user


@router.put("/{item_id}", response_model=UserRead)
def update_user(item_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(models.User, item_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Item not found")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        data["password"] = hash_password(data["password"])

    for field, value in data.items():
        setattr(user, field, value)

    commit_or_409(db)
    db.refresh(user)
    return user


@router.delete("/{item_id}", status_code=204)
def delete_user(item_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, item_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(user)
    commit_or_409(db)
    return None
