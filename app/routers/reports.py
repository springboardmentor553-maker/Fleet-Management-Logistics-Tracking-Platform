from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.report_service import get_maintenance_report, get_operational_report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/maintenance")
def maintenance_report(db: Session = Depends(get_db)):
    return get_maintenance_report(db)


@router.get("/operations")
def operational_report(db: Session = Depends(get_db)):
    return get_operational_report(db)