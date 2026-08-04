import sys
import os

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.trip import Trip
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import AttendanceStatusEnum
from datetime import timedelta

def mark_attendance():
    with Session(engine) as db:
        # Get all trips
        trips = db.query(Trip).all()
        attendance_records = {}

        for trip in trips:
            # find driver for this trip's vehicle at the time
            assignment = db.query(DriverAssignment).filter(
                DriverAssignment.vehicle_id == trip.vehicle_id
            ).order_by(DriverAssignment.assignment_date.desc()).first()

            if not assignment:
                continue
                
            driver_id = assignment.driver_id
            trip_date = trip.created_at.date()
            
            key = (driver_id, trip_date)
            if key not in attendance_records:
                attendance_records[key] = DriverAttendance(
                    driver_id=driver_id,
                    date=trip_date,
                    status=AttendanceStatusEnum.PRESENT
                )

        # insert ignoring duplicates
        for key, record in attendance_records.items():
            existing = db.query(DriverAttendance).filter(
                DriverAttendance.driver_id == record.driver_id,
                DriverAttendance.date == record.date
            ).first()
            if not existing:
                db.add(record)
        
        db.commit()
        print(f"Added {len(attendance_records)} attendance records.")

if __name__ == "__main__":
    mark_attendance()
