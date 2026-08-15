from datetime import datetime, timezone
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.utils.task_logger import log_task_execution, task_logger

@celery_app.task
@log_task_execution("shipment_monitor")
def monitor_shipment_status():
    """
    Check active shipments. If delayed, update status to DELAYED.
    """
    db = SessionLocal()
    try:
        active_shipments = db.query(Shipment).filter(
            Shipment.current_status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY])
        ).all()
        
        now = datetime.now(timezone.utc)
        delayed_count = 0
        for s in active_shipments:
            if s.estimated_delivery_time and s.estimated_delivery_time < now:
                s.current_status = ShipmentStatus.DELAYED
                delayed_count += 1
                task_logger.warning(f"[DELAYED] Shipment {s.tracking_number} is delayed.")
                
        db.commit()
        return f"Marked {delayed_count} shipments as delayed."
    except Exception as e:
        task_logger.error(f"Error monitoring shipments: {e}")
        raise e
    finally:
        db.close()
