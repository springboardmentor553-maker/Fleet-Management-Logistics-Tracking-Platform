from fastapi import APIRouter, Depends
from typing import Dict, Any
import redis
import json

from app.models.user import UserRole
from app.utils.dependencies import RoleChecker

router = APIRouter(
    prefix="/background",
    tags=["Background Jobs"]
)

@router.get("/status", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))])
def get_background_status() -> Dict[str, Any]:
    """
    Check the status of Celery tasks and Redis.
    """
    try:
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, socket_timeout=1, socket_connect_timeout=1)
        r.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
        r = None

    celery_status = "running" if redis_status == "connected" else "unknown"

    tasks = [
        "maintenance_reminder",
        "eta_refresh",
        "shipment_monitor",
        "fuel_analytics",
        "fleet_dashboard_refresh"
    ]
    
    task_statuses = []
    
    if r:
        for t in tasks:
            status_json = r.get(f"task_status:{t}")
            if status_json:
                try:
                    data = json.loads(status_json)
                    task_statuses.append({
                        "name": t,
                        "status": data.get("status", "UNKNOWN"),
                        "last_execution": data.get("last_execution"),
                        "execution_time_seconds": data.get("execution_time_seconds"),
                        "error": data.get("error")
                    })
                except:
                    task_statuses.append({"name": t, "status": "UNKNOWN"})
            else:
                task_statuses.append({"name": t, "status": "PENDING"})
    else:
        task_statuses = [{"name": t, "status": "UNKNOWN"} for t in tasks]

    return {
        "celery": celery_status,
        "redis": redis_status,
        "scheduled_tasks": tasks,
        "task_health": task_statuses
    }

@router.get("/history", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))])
def get_task_history() -> Dict[str, Any]:
    """
    Retrieve task execution history from Redis.
    """
    try:
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, socket_timeout=1)
        history_raw = r.lrange("task_history", 0, 49)
        history = [json.loads(item) for item in history_raw]
    except Exception:
        history = []

    return {"history": history}

# Trigger endpoints (using the new modular structure)
@router.post("/trigger/maintenance", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def trigger_maintenance_reminder():
    from app.tasks.maintenance_tasks import check_maintenance_reminders
    task = check_maintenance_reminders.delay()
    return {"message": "Maintenance reminder task triggered", "task_id": task.id}

@router.post("/trigger/eta", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def trigger_eta_refresh():
    from app.tasks.eta_tasks import refresh_active_trip_etas
    task = refresh_active_trip_etas.delay()
    return {"message": "ETA refresh task triggered", "task_id": task.id}

@router.post("/trigger/shipment", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def trigger_shipment_monitor():
    from app.tasks.shipment_tasks import monitor_shipment_status
    task = monitor_shipment_status.delay()
    return {"message": "Shipment monitor task triggered", "task_id": task.id}

@router.post("/trigger/fuel", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def trigger_fuel_analytics():
    from app.tasks.fuel_tasks import generate_fuel_analytics
    task = generate_fuel_analytics.delay()
    return {"message": "Fuel analytics task triggered", "task_id": task.id}

@router.post("/trigger/dashboard", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def trigger_dashboard_refresh():
    from app.tasks.dashboard_tasks import refresh_fleet_dashboard_cache
    task = refresh_fleet_dashboard_cache.delay()
    return {"message": "Dashboard refresh task triggered", "task_id": task.id}
