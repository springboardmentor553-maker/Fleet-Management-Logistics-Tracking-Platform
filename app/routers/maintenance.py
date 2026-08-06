from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from app.services.maintenance_service import (
    create_maintenance,
    get_all_maintenance,
    get_maintenance,
    update_maintenance,
    delete_maintenance,
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=MaintenanceResponse)
def add_maintenance(maintenance: MaintenanceCreate, db: Session = Depends(get_db)):
    return create_maintenance(maintenance, db)


@router.get("/", response_model=list[MaintenanceResponse])
def fetch_maintenance_records(db: Session = Depends(get_db)):
    return get_all_maintenance(db)


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def fetch_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    return get_maintenance(maintenance_id, db)


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def edit_maintenance(maintenance_id: int, maintenance: MaintenanceUpdate, db: Session = Depends(get_db)):
    return update_maintenance(maintenance_id, maintenance, db)


@router.delete("/{maintenance_id}")
def remove_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    return delete_maintenance(maintenance_id, db)