from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import UserRole
from app.schemas.fleet import (
    FleetPerformanceResponse, FleetSummaryResponse, FleetChartsResponse
)
from app.services.fleet_performance_service import FleetPerformanceService
from app.utils.dependencies import require_manager

router = APIRouter(
    prefix="/fleet",
    tags=["Fleet Performance"]
)

@router.get("/performance", response_model=FleetPerformanceResponse, dependencies=[Depends(require_manager)])
def get_fleet_performance(db: Session = Depends(get_db)):
    """
    Get live fleet performance KPIs (Task 2).
    """
    return FleetPerformanceService(db).get_performance_metrics()

@router.get("/summary", response_model=FleetSummaryResponse, dependencies=[Depends(require_manager)])
def get_fleet_summary(db: Session = Depends(get_db)):
    """
    Get high level fleet summary (Task 3).
    """
    return FleetPerformanceService(db).get_summary()

@router.get("/charts", response_model=FleetChartsResponse, dependencies=[Depends(require_manager)])
def get_fleet_charts(db: Session = Depends(get_db)):
    """
    Get chart-ready JSON data (Task 4).
    """
    return FleetPerformanceService(db).get_charts_data()
