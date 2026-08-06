from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert

from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate,
    MaintenanceAlertResponse,
)

from app.schemas.common import MessageResponse

router = APIRouter()


# ----------------------------------
# Create Alert
# ----------------------------------
@router.post(
    "/",
    response_model=MaintenanceAlertResponse
)
def create_alert(
    alert: MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    ),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == alert.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    maintenance = db.query(Maintenance).filter(
        Maintenance.id == alert.maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found."
        )

    existing = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.maintenance_id == alert.maintenance_id,
        MaintenanceAlert.alert_status == "Pending"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Pending alert already exists."
        )

    new_alert = MaintenanceAlert(
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_message=alert.alert_message,
        alert_type=alert.alert_type,
        alert_status=alert.alert_status.value,
        next_service_date=alert.next_service_date,
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert


# ----------------------------------
# View All Alerts
# ----------------------------------
@router.get(
    "/",
    response_model=list[MaintenanceAlertResponse]
)
def get_all_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):
    return db.query(MaintenanceAlert).all()


# ----------------------------------
# View Alert by ID
# ----------------------------------
@router.get(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found."
        )

    return alert


# ----------------------------------
# Update Alert Status
# ----------------------------------
@router.put(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def update_alert(
    alert_id: int,
    alert: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    ),
):
    db_alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if db_alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found."
        )

    db_alert.alert_status = alert.alert_status.value

    db.commit()
    db.refresh(db_alert)

    return db_alert


# ----------------------------------
# Delete Alert
# ----------------------------------
@router.delete(
    "/{alert_id}",
    response_model=MessageResponse
)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found."
        )

    db.delete(alert)
    db.commit()

    return {
        "message": "Alert deleted successfully."
    }