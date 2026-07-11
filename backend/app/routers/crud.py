from typing import Any, Type

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db


def commit_or_409(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        message = str(exc.orig).lower()
        if "foreign key" in message:
            detail = "Related record not found"
        elif "unique" in message or "duplicate" in message:
            detail = "Record already exists"
        else:
            detail = "Database constraint failed"
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


def build_crud_router(
    *,
    model: Type[Any],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    read_schema: Type[BaseModel],
) -> APIRouter:
    router = APIRouter()

    @router.get("/", response_model=list[read_schema])
    def list_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        return db.query(model).offset(skip).limit(limit).all()

    @router.post("/", response_model=read_schema, status_code=status.HTTP_201_CREATED)
    def create_item(payload: create_schema, db: Session = Depends(get_db)):
        item = model(**payload.model_dump())
        db.add(item)
        commit_or_409(db)
        db.refresh(item)
        return item

    @router.get("/{item_id}", response_model=read_schema)
    def get_item(item_id: int, db: Session = Depends(get_db)):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return item

    @router.put("/{item_id}", response_model=read_schema)
    def update_item(item_id: int, payload: update_schema, db: Session = Depends(get_db)):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)

        commit_or_409(db)
        db.refresh(item)
        return item

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        db.delete(item)
        commit_or_409(db)
        return None

    return router
