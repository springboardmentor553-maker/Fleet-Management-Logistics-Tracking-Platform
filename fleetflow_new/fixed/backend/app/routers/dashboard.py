from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter()


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    return {
        "users": db.query(models.User).count(),
        "vehicles": db.query(models.Vehicle).count(),
        "drivers": db.query(models.Driver).count(),
        "shipments": db.query(models.Shipment).count(),
        "routes": db.query(models.Route).count(),
        "maintenance_records": db.query(models.MaintenanceRecord).count(),
        "unread_notifications": db.query(models.Notification)
        .filter(models.Notification.is_read == 0)
        .count(),
    }
