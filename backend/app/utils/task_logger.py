import logging
import functools
import time
from datetime import datetime, timezone
import redis
import json

def setup_celery_logger():
    logger = logging.getLogger('celery_tasks')
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler('logs/celery.log')
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

task_logger = setup_celery_logger()

from app.config import settings

try:
    redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, socket_timeout=1, socket_connect_timeout=1)
except Exception:
    redis_client = None

def log_task_execution(task_name):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            task_logger.info(f"Starting task: {task_name}")
            
            try:
                result = func(*args, **kwargs)
                status = "SUCCESS"
                error_msg = None
                task_logger.info(f"Completed task: {task_name}")
            except Exception as e:
                status = "FAILED"
                error_msg = str(e)
                task_logger.error(f"Task {task_name} failed: {error_msg}")
                raise e
            finally:
                execution_time = time.time() - start_time
                
                if redis_client:
                    try:
                        log_entry = {
                            "task_name": task_name,
                            "last_execution": datetime.now(timezone.utc).isoformat(),
                            "execution_time_seconds": round(execution_time, 2),
                            "status": status,
                            "error": error_msg
                        }
                        # Store latest execution status in Redis
                        redis_client.set(f"task_status:{task_name}", json.dumps(log_entry))
                        # Keep a history list of last 50 executions
                        redis_client.lpush(f"task_history", json.dumps(log_entry))
                        redis_client.ltrim(f"task_history", 0, 49)
                    except Exception as redis_err:
                        task_logger.error(f"Failed to write task status to Redis: {redis_err}")
                
            return result
        return wrapper
    return decorator
