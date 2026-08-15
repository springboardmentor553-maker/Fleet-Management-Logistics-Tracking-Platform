from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import UserRole
from app.schemas.analytics import (
    AnalyticsResponse, OverviewAnalyticsResponse, DriverAnalyticsResponse,
    VehicleAnalyticsResponse, ShipmentAnalyticsResponse, TripAnalyticsResponse
)
from app.services.analytics_service import AnalyticsService
from app.utils.dependencies import require_admin, require_manager
from sqlalchemy import func
from app.models.fuel_record import FuelRecordModel
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip, TripStatus
from typing import Dict, Any

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("", response_model=AnalyticsResponse, dependencies=[Depends(require_manager)])
def get_fleet_analytics(db: Session = Depends(get_db)):
    """
    Get consolidated fleet performance analytics.
    - Admin & Fleet Managers have full access.
    - Dispatchers have read-only access.
    - Drivers have no access.
    """
    analytics_service = AnalyticsService(db)
    return analytics_service.get_consolidated_analytics()

@router.get("/overview", response_model=OverviewAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_overview_analytics(db: Session = Depends(get_db)):
    """
    Get overview analytics (Tasks 2).
    """
    return AnalyticsService(db).get_overview()

@router.get("/drivers", response_model=DriverAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_driver_analytics(db: Session = Depends(get_db)):
    """
    Get driver analytics (Task 3).
    """
    return AnalyticsService(db).get_drivers()

@router.get("/vehicles", response_model=VehicleAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_vehicle_analytics(db: Session = Depends(get_db)):
    """
    Get vehicle analytics (Task 4).
    """
    return AnalyticsService(db).get_vehicles()

@router.get("/shipments", response_model=ShipmentAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_shipment_analytics(db: Session = Depends(get_db)):
    """
    Get shipment analytics (Task 5).
    """
    return AnalyticsService(db).get_shipments()

@router.get("/trips", response_model=TripAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_trip_analytics(db: Session = Depends(get_db)):
    """
    Get trip analytics (Task 6).
    """
    return AnalyticsService(db).get_trips()

@router.get("/fuel", dependencies=[Depends(require_manager)])
def get_fuel_analytics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_consumed = db.query(func.sum(FuelRecordModel.fuel_quantity)).scalar() or 0.0
    total_cost = db.query(func.sum(FuelRecordModel.fuel_cost)).scalar() or 0.0
    record_count = db.query(FuelRecordModel).count()
    
    average_consumption = (total_consumed / record_count) if record_count > 0 else 0.0

    vehicle_usage = db.query(
        Vehicle.license_plate,
        func.sum(FuelRecordModel.fuel_quantity).label("total_usage")
    ).join(FuelRecordModel).group_by(Vehicle.license_plate).order_by(func.sum(FuelRecordModel.fuel_quantity).desc()).all()

    highest_vehicle = vehicle_usage[0].license_plate if vehicle_usage else "N/A"
    lowest_vehicle = vehicle_usage[-1].license_plate if vehicle_usage else "N/A"

    return {
        "total_fuel_consumed": total_consumed,
        "total_fuel_cost": total_cost,
        "average_fuel_consumption": average_consumption,
        "highest_fuel_usage_vehicle": highest_vehicle,
        "lowest_fuel_usage_vehicle": lowest_vehicle
    }

@router.get("/operations", dependencies=[Depends(require_manager)])
def get_operations_analytics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_deliveries = db.query(Shipment).count()
    successful_deliveries = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
    delayed_deliveries = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()
    cancelled_deliveries = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CANCELLED).count()

    completed_trips = db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).all()
    total_distance = sum([t.distance_km for t in completed_trips if t.distance_km])
    average_distance = (total_distance / len(completed_trips)) if len(completed_trips) > 0 else 0.0

    total_time_seconds = 0
    delivered_shipments = db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).all()
    valid_time_count = 0
    
    for s in delivered_shipments:
        if s.trip and s.trip.scheduled_end_time and s.created_at:
            t_end = s.trip.scheduled_end_time.replace(tzinfo=None)
            t_start = s.created_at.replace(tzinfo=None)
            diff = (t_end - t_start).total_seconds()
            if diff > 0:
                total_time_seconds += diff
                valid_time_count += 1
                
    if valid_time_count > 0:
        avg_seconds = total_time_seconds / valid_time_count
        hours = int(avg_seconds // 3600)
        minutes = int((avg_seconds % 3600) // 60)
        average_delivery_time = f"{hours}h {minutes}m"
    else:
        average_delivery_time = "0h 0m"

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance": average_distance,
        "average_delivery_time": average_delivery_time
    }
