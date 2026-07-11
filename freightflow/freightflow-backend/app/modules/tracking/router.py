from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.tracking import service
from app.modules.tracking.models import TrackingPing
from app.modules.tracking.schemas import LatestPositionOut, TrackingPingCreate, TrackingPingOut

router = APIRouter(prefix="/tracking", tags=["Live Tracking"])


@router.post("/ping", response_model=TrackingPingOut, status_code=status.HTTP_201_CREATED)
def record_ping(payload: TrackingPingCreate, db: Session = Depends(get_db)) -> TrackingPing:
    return service.record_ping(db, payload)


@router.get("/shipment/{shipment_id}/history", response_model=list[TrackingPingOut])
def get_history(shipment_id: int, db: Session = Depends(get_db)) -> list[TrackingPing]:
    return service.get_shipment_history(db, shipment_id)


@router.get("/shipment/{shipment_id}/latest", response_model=LatestPositionOut)
def get_latest(shipment_id: int, db: Session = Depends(get_db)) -> TrackingPing:
    return service.get_latest_position(db, shipment_id)
