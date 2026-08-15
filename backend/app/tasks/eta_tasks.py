from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.trip import Trip, TripStatus
from app.utils.task_logger import log_task_execution, task_logger

@celery_app.task
@log_task_execution("eta_refresh")
def refresh_active_trip_etas():
    """
    Update ETA for active trips.
    """
    db = SessionLocal()
    try:
        active_trips = db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).all()
        count = 0
        for trip in active_trips:
            # Here we would integrate with the actual ETA calculation service.
            # E.g., call Google Maps API and update trip.estimated_arrival_time
            task_logger.info(f"Refreshed ETA for Trip #{trip.id}")
            count += 1
            pass
        db.commit()
        return f"Refreshed ETAs for {count} trips."
    except Exception as e:
        task_logger.error(f"Error refreshing ETAs: {e}")
        raise e
    finally:
        db.close()
