from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.maintenance_alert import MaintenanceAlertResponse, MaintenanceAlertUpdate
from app.services.maintenance_alert_service import (
    generate_alert_for_maintenance,
    get_all_alerts,
    get_alert,
    update_alert_status,
    delete_alert,
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


@router.get("/{alert_id}", response_model=MaintenanceAlertResponse)
def fetch_alert(alert_id: int, db: Session = Depends(get_db)):
    return get_alert(alert_id, db)


@router.put("/{alert_id}", response_model=MaintenanceAlertResponse)
def edit_alert_status(alert_id: int, update: MaintenanceAlertUpdate, db: Session = Depends(get_db)):
    return update_alert_status(alert_id, update, db)


@router.delete("/{alert_id}")
def remove_alert(alert_id: int, db: Session = Depends(get_db)):
    return delete_alert(alert_id, db)