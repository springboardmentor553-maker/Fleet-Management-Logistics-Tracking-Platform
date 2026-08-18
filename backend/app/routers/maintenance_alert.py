from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate,
    MaintenanceAlertResponse,
)
from app.utils.security import require_role


router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"],
)


# ---------------------------------------------------
# Create Alert
# ---------------------------------------------------

@router.post(
    "/",
    response_model=MaintenanceAlertResponse,
)
def create_alert(
    alert: MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    # Check vehicle
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == alert.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # Check maintenance record
    maintenance = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.id == alert.maintenance_id
        )
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found",
        )

    # Make sure the maintenance belongs to the selected vehicle
    if maintenance.vehicle_id != alert.vehicle_id:
        raise HTTPException(
            status_code=400,
            detail="Maintenance record does not belong to this vehicle",
        )

    # Prevent duplicate pending alerts
    existing = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id
            == alert.maintenance_id,
            MaintenanceAlert.alert_status == "Pending",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Pending alert already exists",
        )

    new_alert = MaintenanceAlert(
        **alert.model_dump()
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert


# ---------------------------------------------------
# Get All Alerts
# ---------------------------------------------------

@router.get(
    "/",
    response_model=list[MaintenanceAlertResponse],
)
def get_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    alerts = (
        db.query(MaintenanceAlert)
        .order_by(
            MaintenanceAlert.generated_date.desc()
        )
        .all()
    )

    return alerts


# ---------------------------------------------------
# Get Alert By ID
# ---------------------------------------------------

@router.get(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse,
)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return alert


# ---------------------------------------------------
# Update Alert Status
# ---------------------------------------------------

@router.put(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse,
)
def update_alert(
    alert_id: int,
    updated_alert: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin"])
    ),
):
    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    update_data = updated_alert.model_dump(
        exclude_unset=True
    )

    if "alert_status" in update_data:
        alert.alert_status = update_data["alert_status"]

    db.commit()
    db.refresh(alert)

    return alert


# ---------------------------------------------------
# Delete Alert
# ---------------------------------------------------

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin"])
    ),
):
    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    db.delete(alert)
    db.commit()

    return {
        "message": "Maintenance Alert Deleted Successfully"
    }


# ---------------------------------------------------
# Check Upcoming Maintenance and Generate Alerts
# ---------------------------------------------------

@router.post("/check")
def check_maintenance_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    today = date.today()
    alert_until = today + timedelta(days=7)

    # Current MaintenanceRecord has service_date,
    # but does NOT have next_service_date.
    #
    # Therefore we use service_date as the available
    # maintenance date for this implementation.

    maintenances = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.status != "completed",
            MaintenanceRecord.service_date <= alert_until,
        )
        .all()
    )

    created_alerts = []
    existing_alerts = []

    for maintenance in maintenances:

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == maintenance.vehicle_id
            )
            .first()
        )

        if not vehicle:
            continue

        # Prevent duplicate pending alert
        existing = (
            db.query(MaintenanceAlert)
            .filter(
                MaintenanceAlert.maintenance_id
                == maintenance.id,
                MaintenanceAlert.alert_status
                == "Pending",
            )
            .first()
        )

        if existing:
            existing_alerts.append(existing.id)
            continue

        service_date = maintenance.service_date

        if service_date < today:

            alert_type = "Maintenance Overdue"

            alert_message = (
                f"Maintenance overdue for "
                f"vehicle {vehicle.license_plate}"
            )

        elif service_date == today:

            alert_type = "Maintenance Due Today"

            alert_message = (
                f"Maintenance is due today for "
                f"vehicle {vehicle.license_plate}"
            )

        else:

            days_remaining = (
                service_date - today
            ).days

            alert_type = "Upcoming Maintenance"

            alert_message = (
                f"Maintenance due in "
                f"{days_remaining} day(s) for "
                f"vehicle {vehicle.license_plate}"
            )

        new_alert = MaintenanceAlert(
            vehicle_id=vehicle.id,
            maintenance_id=maintenance.id,
            alert_message=alert_message,
            alert_type=alert_type,
            alert_status="Pending",
            next_service_date=service_date,
        )

        db.add(new_alert)
        created_alerts.append(new_alert)

    db.commit()

    for alert in created_alerts:
        db.refresh(alert)

    return {
        "success": True,
        "message": "Maintenance alert check completed",
        "created_count": len(created_alerts),
        "existing_count": len(existing_alerts),
        "alerts": [
            {
                "id": alert.id,
                "vehicle_id": alert.vehicle_id,
                "maintenance_id": alert.maintenance_id,
                "alert_type": alert.alert_type,
                "alert_message": alert.alert_message,
                "alert_status": alert.alert_status,
                "next_service_date": str(
                    alert.next_service_date
                ),
            }
            for alert in created_alerts
        ],
    }