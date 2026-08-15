from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.fuel_log import FuelLog
from app.utils.task_logger import log_task_execution, task_logger
import json
import redis

@celery_app.task
@log_task_execution("fuel_analytics")
def generate_fuel_analytics():
    """
    Nightly fuel usage and cost analytics.
    Store in Redis for quick dashboard access.
    """
    db = SessionLocal()
    try:
        today = datetime.now(timezone.utc)
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Daily
        daily_usage = db.query(func.sum(FuelLog.fuel_quantity)).filter(FuelLog.fuel_date >= yesterday).scalar() or 0.0
        
        # Weekly Cost
        weekly_cost = db.query(func.sum(FuelLog.fuel_cost)).filter(FuelLog.fuel_date >= week_ago).scalar() or 0.0
        
        # Monthly Consumption
        monthly_usage = db.query(func.sum(FuelLog.fuel_quantity)).filter(FuelLog.fuel_date >= month_ago).scalar() or 0.0
        
        analytics = {
            "daily_fuel_usage": daily_usage,
            "weekly_fuel_cost": weekly_cost,
            "monthly_fuel_consumption": monthly_usage,
            "generated_at": today.isoformat()
        }
        
        try:
            r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
            r.set("fuel_analytics_cache", json.dumps(analytics))
        except Exception as e:
            task_logger.error(f"Failed to cache fuel analytics: {e}")
            
        return f"Generated Fuel Analytics: Daily {daily_usage}L, Weekly Cost ${weekly_cost}"
    except Exception as e:
        task_logger.error(f"Error generating fuel analytics: {e}")
        raise e
    finally:
        db.close()
