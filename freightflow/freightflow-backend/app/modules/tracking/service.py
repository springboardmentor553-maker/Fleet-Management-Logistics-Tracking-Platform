from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.exceptions import NotFoundError
from app.modules.shipments.models import Shipment
from app.modules.tracking.models import TrackingPing
from app.modules.tracking.schemas import TrackingPingCreate


def record_ping(db: Session, payload: TrackingPingCreate) -> TrackingPing:
    shipment = db.get(Shipment, payload.shipment_id)
    if shipment is None:
        raise NotFoundError(f"Shipment {payload.shipment_id} was not found")

    ping = TrackingPing(**payload.model_dump())
    db.add(ping)
    db.commit()
    db.refresh(ping)
    return ping


def get_shipment_history(db: Session, shipment_id: int, limit: int = 200) -> list[TrackingPing]:
    query = (
        select(TrackingPing)
        .where(TrackingPing.shipment_id == shipment_id)
        .order_by(TrackingPing.recorded_at.desc())
        .limit(limit)
    )
    return list(db.scalars(query).all())


def get_latest_position(db: Session, shipment_id: int) -> TrackingPing:
    ping = db.scalar(
        select(TrackingPing)
        .where(TrackingPing.shipment_id == shipment_id)
        .order_by(TrackingPing.recorded_at.desc())
        .limit(1)
    )
    if ping is None:
        raise NotFoundError(f"No tracking data recorded yet for shipment {shipment_id}")
    return ping
