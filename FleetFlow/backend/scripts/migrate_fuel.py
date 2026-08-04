from app.database import SessionLocal
from app.models.driver_assignment import DriverAssignment
from app.models.enums import AssignmentStatusEnum
from app.models.fuel_record import FuelRecord


def migrate():
    db = SessionLocal()
    try:
        records = db.query(FuelRecord).all()
        updated_count = 0
        for rec in records:
            changed = False
            # Calculate cost at 95 per litre
            if rec.fuel_cost != rec.fuel_quantity * 95.0:
                rec.fuel_cost = rec.fuel_quantity * 95.0
                changed = True
            
            # Map missing driver
            if rec.driver_id is None:
                assignment = db.query(DriverAssignment).filter(
                    DriverAssignment.vehicle_id == rec.vehicle_id,
                    DriverAssignment.status == AssignmentStatusEnum.ACTIVE
                ).first()
                if assignment:
                    rec.driver_id = assignment.driver_id
                    changed = True
            
            if changed:
                updated_count += 1
                
        db.commit()
        print(f"Updated {updated_count} fuel records.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
