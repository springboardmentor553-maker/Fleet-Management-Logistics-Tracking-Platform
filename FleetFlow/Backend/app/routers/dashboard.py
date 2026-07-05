from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return DashboardStats(
        total_vehicles=db.query(Vehicle).count(),
        available_vehicles=db.query(Vehicle).filter(Vehicle.is_available == True).count(),
        active_drivers=db.query(Driver).filter(Driver.is_available == False).count(),
        total_shipments=db.query(Shipment).count(),
        pending_shipments=db.query(Shipment).filter(Shipment.status == "pending").count(),
        in_transit_shipments=db.query(Shipment).filter(Shipment.status == "in_transit").count(),
        delivered_shipments=db.query(Shipment).filter(Shipment.status == "delivered").count(),
    )
