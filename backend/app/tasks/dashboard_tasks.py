from datetime import datetime, timezone
from sqlalchemy import func
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.utils.task_logger import log_task_execution, task_logger
import json
import redis

@celery_app.task
@log_task_execution("fleet_dashboard_refresh")
def refresh_fleet_dashboard_cache():
    """
    1-minute interval fleet health & utilization calculations.
    """
    db = SessionLocal()
    try:
        total_vehicles = db.query(Vehicle).count()
        active_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        maintenance_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        
        vehicle_utilization = (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0
        fleet_health_score = 100 - ((maintenance_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0)
        
        total_drivers = db.query(Driver).count()
        active_drivers = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
        driver_utilization = (active_drivers / total_drivers * 100) if total_drivers > 0 else 0
        
        active_trips = db.query(Trip).filter(Trip.trip_status == TripStatus.IN_TRANSIT).count()
        total_trips = db.query(Trip).count()
        
        operational_efficiency = (active_trips / total_trips * 100) if total_trips > 0 else 0
        
        dashboard_data = {
            "fleet_health_score": round(fleet_health_score, 1),
            "vehicle_utilization": round(vehicle_utilization, 1),
            "driver_utilization": round(driver_utilization, 1),
            "operational_efficiency": round(operational_efficiency, 1),
            "active_vehicles": active_vehicles,
            "maintenance_vehicles": maintenance_vehicles,
            "last_refreshed": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
            r.set("fleet_dashboard_cache", json.dumps(dashboard_data))
        except Exception as e:
            task_logger.error(f"Failed to cache dashboard data: {e}")
            
        return f"Dashboard Refreshed. Health: {fleet_health_score}%"
    except Exception as e:
        task_logger.error(f"Error refreshing dashboard: {e}")
        raise e
    finally:
        db.close()
