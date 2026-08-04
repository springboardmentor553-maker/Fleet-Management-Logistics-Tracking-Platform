import sys
import os

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.vehicle import Vehicle
from app.models.enums import VehicleStatusEnum, MaintenanceStatusEnum, MaintenanceCategoryEnum
from app.models.maintenance import MaintenanceRecord
from datetime import date, timedelta

def generate_maintenance():
    with Session(engine) as db:
        # Get all maintenance vehicles
        vehicles = db.query(Vehicle).filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE).all()
        records_added = 0
        
        for vehicle in vehicles:
            existing = db.query(MaintenanceRecord).filter(
                MaintenanceRecord.vehicle_id == vehicle.id,
                MaintenanceRecord.status.in_([MaintenanceStatusEnum.SCHEDULED, MaintenanceStatusEnum.IN_PROGRESS])
            ).first()
            
            if not existing:
                rec = MaintenanceRecord(
                    vehicle_id=vehicle.id,
                    category=MaintenanceCategoryEnum.GENERAL_INSPECTION,
                    service_cost=1500.0,
                    service_date=date.today(),
                    status=MaintenanceStatusEnum.IN_PROGRESS,
                    notes="Auto-generated maintenance record to match vehicle status"
                )
                db.add(rec)
                records_added += 1
                
        db.commit()
        print(f"Added {records_added} maintenance records.")

if __name__ == "__main__":
    generate_maintenance()
