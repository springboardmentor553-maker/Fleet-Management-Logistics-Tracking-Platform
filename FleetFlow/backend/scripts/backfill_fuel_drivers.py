from app.database import SessionLocal
from app.models.driver_assignment import DriverAssignment
from app.models.enums import AssignmentStatusEnum
from app.models.fuel_record import FuelRecord


def backfill():
    db = SessionLocal()
    fuel_records = db.query(FuelRecord).filter(FuelRecord.driver_id == None).all()
    count = 0
    for fr in fuel_records:
        assignment = db.query(DriverAssignment).filter(
            DriverAssignment.vehicle_id == fr.vehicle_id,
            DriverAssignment.status == AssignmentStatusEnum.ACTIVE
        ).first()
        if assignment:
            fr.driver_id = assignment.driver_id
            count += 1
    db.commit()
    print(f"Updated {count} fuel records with drivers.")

if __name__ == "__main__":
    backfill()
