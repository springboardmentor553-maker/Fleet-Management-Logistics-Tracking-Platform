from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.maintenance import Maintenance, MaintenanceStatus

class MaintenanceAlertService:
    @staticmethod
    def get_alerts(db: Session):
        vehicles = db.query(Vehicle).filter(Vehicle.status.in_([VehicleStatus.ACTIVE, VehicleStatus.MAINTENANCE])).all()
        now = datetime.now(timezone.utc)
        alerts = []

        for v in vehicles:
            if v.status == VehicleStatus.MAINTENANCE:
                record = db.query(Maintenance).filter(
                    Maintenance.vehicle_id == v.id,
                    Maintenance.maintenance_status == MaintenanceStatus.IN_PROGRESS
                ).order_by(Maintenance.service_date.desc()).first()
                
                alerts.append({
                    "maintenance_id": record.id if record else None,
                    "vehicle_id": v.id,
                    "vehicle": v.license_plate,  # Requirement: "vehicle":"KA01AB1234"
                    "license_plate": v.license_plate, # Backwards compatibility
                    "category": record.maintenance_category.value if record and hasattr(record.maintenance_category, 'value') else (record.maintenance_category if record else "Unknown"),
                    "next_service_date": record.next_service_date if record else None,
                    "alert": "In Progress",
                    "alert_type": "IN_PROGRESS" # Backwards compatibility
                })
                continue

            latest_record = db.query(Maintenance).filter(
                Maintenance.vehicle_id == v.id,
                Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED
            ).order_by(Maintenance.service_date.desc()).first()

            if not latest_record or not latest_record.next_service_date:
                has_history = db.query(Maintenance).filter(Maintenance.vehicle_id == v.id).count() > 0
                if not has_history:
                    alerts.append({
                        "maintenance_id": None,
                        "vehicle_id": v.id,
                        "vehicle": v.license_plate,
                        "license_plate": v.license_plate,
                        "category": None,
                        "next_service_date": None,
                        "alert": "No Schedule",
                        "alert_type": "NO_SCHEDULE"
                    })
                continue

            next_date = latest_record.next_service_date
            
            # Format category enum to string if needed
            category_val = latest_record.maintenance_category.value if hasattr(latest_record.maintenance_category, 'value') else latest_record.maintenance_category
            
            if next_date < now:
                alerts.append({
                    "maintenance_id": latest_record.id,
                    "vehicle_id": v.id,
                    "vehicle": v.license_plate,
                    "license_plate": v.license_plate,
                    "category": category_val,
                    "next_service_date": next_date,
                    "alert": "Overdue",
                    "alert_type": "OVERDUE"
                })
            elif next_date < now + timedelta(days=7):
                alerts.append({
                    "maintenance_id": latest_record.id,
                    "vehicle_id": v.id,
                    "vehicle": v.license_plate,
                    "license_plate": v.license_plate,
                    "category": category_val,
                    "next_service_date": next_date,
                    "alert": "Due Soon",
                    "alert_type": "DUE_SOON"
                })

        return alerts
