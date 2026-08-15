from sqlalchemy.orm import Session

from app.models.maintenance_alert import MaintenanceAlert
from app.models.vehicle import Vehicle
from app.models.maintenance import Maintenance

from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate
)


ALLOWED_ALERT_STATUSES = [
    "Pending",
    "Sent",
    "Completed"
]


def create_alert(
    db: Session,
    alert: MaintenanceAlertCreate
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == alert.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError("Vehicle not found")

    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == alert.maintenance_id)
        .first()
    )

    if not maintenance:
        raise ValueError("Maintenance record not found")

    if alert.alert_status not in ALLOWED_ALERT_STATUSES:
        raise ValueError("Invalid alert status")

    pending_alert = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == alert.maintenance_id,
            MaintenanceAlert.alert_status == "Pending"
        )
        .first()
    )

    if pending_alert:
        raise ValueError(
            "A pending alert already exists for this maintenance record"
        )

    db_alert = MaintenanceAlert(
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_message=alert.alert_message,
        alert_type=alert.alert_type,
        alert_status=alert.alert_status,
        next_service_date=alert.next_service_date
    )

    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    return db_alert


def get_all_alerts(db: Session):
    return db.query(MaintenanceAlert).all()


def get_alert_by_id(
    db: Session,
    alert_id: int
):

    return (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )


def update_alert_status(
    db: Session,
    alert_id: int,
    alert: MaintenanceAlertUpdate
):

    db_alert = get_alert_by_id(
        db,
        alert_id
    )

    if not db_alert:
        return None

    if alert.alert_status not in ALLOWED_ALERT_STATUSES:
        raise ValueError("Invalid alert status")

    db_alert.alert_status = alert.alert_status

    db.commit()
    db.refresh(db_alert)

    return db_alert


def delete_alert(
    db: Session,
    alert_id: int
):

    db_alert = get_alert_by_id(
        db,
        alert_id
    )

    if not db_alert:
        return None

    db.delete(db_alert)
    db.commit()

    return db_alert