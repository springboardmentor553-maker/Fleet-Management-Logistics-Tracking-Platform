from app.database import SessionLocal
from app.models.driver_attendance import DriverAttendance
from app.models.enums import AttendanceStatusEnum
from app.models.trip import Trip


def backfill():
    db = SessionLocal()
    trips = db.query(Trip).all()
    count = 0
    for t in trips:
        if not t.scheduled_start_time or not t.driver_id:
            continue
        date_val = t.scheduled_start_time.date()
        # Check if attendance exists
        att = db.query(DriverAttendance).filter(
            DriverAttendance.driver_id == t.driver_id,
            DriverAttendance.date == date_val
        ).first()
        if not att:
            new_att = DriverAttendance(
                driver_id=t.driver_id,
                date=date_val,
                status=AttendanceStatusEnum.PRESENT,
                check_in_time=t.scheduled_start_time,
                check_out_time=t.scheduled_end_time or None
            )
            db.add(new_att)
            count += 1
    db.commit()
    print(f"Backfilled {count} attendance records from trips.")

if __name__ == "__main__":
    backfill()
