from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.maintenance_alert import MaintenanceAlertResponse
from app.services.maintenance_alert_service import (
    generate_alert_for_maintenance,
    get_all_alerts,
    resolve_alert,
)

router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/{maintenance_id}", response_model=MaintenanceAlertResponse)
def create_alert(maintenance_id: int, db: Session = Depends(get_db)):
    return generate_alert_for_maintenance(maintenance_id, db)


@router.get("/", response_model=list[MaintenanceAlertResponse])
def fetch_alerts(db: Session = Depends(get_db)):
    return get_all_alerts(db)


@router.put("/{alert_id}/resolve", response_model=MaintenanceAlertResponse)
def mark_alert_resolved(alert_id: int, db: Session = Depends(get_db)):
    return resolve_alert(alert_id, db)