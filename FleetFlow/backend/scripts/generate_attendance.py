import sys
import os
from datetime import date

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import engine
from app.models.core import Trip
from app.models.driver_attendance import DriverAttendance
from app.models.enums import AttendanceStatusEnum

def generate_attendance():
    with Session(engine) as db:
        # Get all trips and their start/end dates
        trips = db.query(Trip).all()
        records_added = 0
        
        for trip in trips:
            if not trip.driver_id or not trip.scheduled_start_time:
                continue
                
            # Iterate through days from start_time to end_time (or current day if not ended)
            start_date = trip.scheduled_start_time.date()
            end_date = trip.scheduled_end_time.date() if trip.scheduled_end_time else date.today()
            
            # Create a record for each day
            for n in range(int((end_date - start_date).days) + 1):
                from datetime import timedelta
                current_date = start_date + timedelta(days=n)
                
                # Check if attendance already exists
                existing = db.query(DriverAttendance).filter(
                    DriverAttendance.driver_id == trip.driver_id,
                    DriverAttendance.date == current_date
                ).first()
                
                if not existing:
                    att = DriverAttendance(
                        driver_id=trip.driver_id,
                        date=current_date,
                        status=AttendanceStatusEnum.PRESENT,
                        check_in_time=trip.scheduled_start_time,
                        check_out_time=trip.scheduled_end_time
                    )
                    db.add(att)
                    records_added += 1
                    
        db.commit()
        print(f"Added {records_added} attendance records.")

if __name__ == "__main__":
    generate_attendance()
