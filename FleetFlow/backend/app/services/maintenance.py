from sqlalchemy.orm import Session

from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.models.maintenance_alert import MaintenanceAlert

from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate
)


def create_maintenance(
    db: Session,
    maintenance: MaintenanceCreate
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError("Vehicle not found")

    if maintenance.maintenance_status == "Scheduled":
        vehicle.current_status = "Under Maintenance"

    db_maintenance = Maintenance(
        vehicle_id=maintenance.vehicle_id,
        maintenance_category=maintenance.maintenance_category.value,
        service_date=maintenance.service_date,
        next_service_date=maintenance.next_service_date,
        service_cost=maintenance.service_cost,
        service_provider=maintenance.service_provider,
        maintenance_status=maintenance.maintenance_status,
        notes=maintenance.notes
    )

    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)

    return db_maintenance


def get_all_maintenance(db: Session):
    return db.query(Maintenance).all()


def get_maintenance_by_id(
    db: Session,
    maintenance_id: int
):

    return (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )


def update_maintenance(
    db: Session,
    maintenance_id: int,
    maintenance: MaintenanceUpdate
):

    db_maintenance = get_maintenance_by_id(
        db,
        maintenance_id
    )

    if not db_maintenance:
        return None

    update_data = maintenance.model_dump(
        exclude_unset=True
    )

    if "vehicle_id" in update_data:

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == update_data["vehicle_id"]
            )
            .first()
        )

        if not vehicle:
            raise ValueError("Vehicle not found")

    for key, value in update_data.items():

        if key == "maintenance_category":
            value = value.value

        if key == "maintenance_status":

            if value == "Scheduled":
                db_maintenance.vehicle.current_status = (
                    "Under Maintenance"
                )

            elif value == "Completed":

                db_maintenance.vehicle.current_status = (
                    "Available"
                )

                pending_alerts = (
                    db.query(MaintenanceAlert)
                    .filter(
                        MaintenanceAlert.maintenance_id
                        == db_maintenance.id,
                        MaintenanceAlert.alert_status
                        == "Pending"
                    )
                    .all()
                )

                for alert in pending_alerts:
                    alert.alert_status = "Completed"

        setattr(
            db_maintenance,
            key,
            value
        )

    db.commit()
    db.refresh(db_maintenance)

    return db_maintenance


def delete_maintenance(
    db: Session,
    maintenance_id: int
):

    db_maintenance = get_maintenance_by_id(
        db,
        maintenance_id
    )

    if not db_maintenance:
        return None

    db.delete(db_maintenance)
    db.commit()

    return db_maintenance