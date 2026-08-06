from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
from typing import Optional

from app.utils.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.fuel import FuelRecord
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.schemas.analytics import FuelAnalyticsResponse, OperationalAnalyticsResponse, VehicleUsageInfo
from app.services.maps import KNOWN_LOCATIONS, haversine_distance

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_local_coords(location_str: str) -> tuple[float, float]:
    if not location_str:
        return (10.0, 75.0)
    norm = location_str.strip().lower()
    if norm in KNOWN_LOCATIONS:
        return KNOWN_LOCATIONS[norm]
    import hashlib
    digest = hashlib.md5(norm.encode("utf-8")).hexdigest()
    lat = 8.0 + (int(digest[:6], 16) % 2400) / 100.0
    lng = 68.0 + (int(digest[6:12], 16) % 2400) / 100.0
    return (lat, lng)


@router.get("/fuel", response_model=FuelAnalyticsResponse)
def get_fuel_analytics(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # 1. Total Fuel Consumed
    total_qty = db.query(func.sum(FuelRecord.fuel_quantity)).scalar() or 0.0

    # 2. Total Fuel Cost
    total_cost = db.query(func.sum(FuelRecord.fuel_cost)).scalar() or 0.0

    # 3. Average Fuel Consumption (Average fuel liters per fueling record)
    record_count = db.query(FuelRecord).count()
    avg_consumption = total_qty / record_count if record_count > 0 else 0.0

    # 4. Vehicle with Highest Fuel Usage
    highest_record = (
        db.query(FuelRecord.vehicle_id, func.sum(FuelRecord.fuel_quantity).label("total_qty"))
        .group_by(FuelRecord.vehicle_id)
        .order_by(text("total_qty DESC"))
        .first()
    )
    highest_usage = None
    if highest_record:
        vehicle = db.query(Vehicle).filter(Vehicle.id == highest_record.vehicle_id).first()
        if vehicle:
            highest_usage = VehicleUsageInfo(
                vehicle_id=vehicle.id,
                plate_number=vehicle.plate_number,
                total_fuel=highest_record.total_qty
            )

    # 5. Vehicle with Lowest Fuel Usage
    lowest_record = (
        db.query(FuelRecord.vehicle_id, func.sum(FuelRecord.fuel_quantity).label("total_qty"))
        .group_by(FuelRecord.vehicle_id)
        .order_by(text("total_qty ASC"))
        .first()
    )
    lowest_usage = None
    if lowest_record:
        vehicle = db.query(Vehicle).filter(Vehicle.id == lowest_record.vehicle_id).first()
        if vehicle:
            lowest_usage = VehicleUsageInfo(
                vehicle_id=vehicle.id,
                plate_number=vehicle.plate_number,
                total_fuel=lowest_record.total_qty
            )

    return FuelAnalyticsResponse(
        total_fuel_consumed=total_qty,
        total_fuel_cost=total_cost,
        average_fuel_consumption=avg_consumption,
        vehicle_highest_usage=highest_usage,
        vehicle_lowest_usage=lowest_usage,
    )


@router.get("/operations", response_model=OperationalAnalyticsResponse)
def get_operational_analytics(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # 1. Total Deliveries (Shipments)
    total_deliveries = db.query(Shipment).count()

    # 2. Successful Deliveries (Delivered Status)
    successful_deliveries = db.query(Shipment).filter(Shipment.status == "delivered").count()

    # 3. Cancelled Deliveries
    cancelled_deliveries = db.query(Shipment).filter(Shipment.status == "cancelled").count()

    # 4. Delayed Deliveries (Delivered after 24 hrs of created_at OR In-transit > 24 hrs)
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    
    delivered_delayed = db.query(Shipment).filter(
        Shipment.status == "delivered",
        Shipment.delivered_at - Shipment.created_at > timedelta(days=1)
    ).count()

    in_transit_delayed = db.query(Shipment).filter(
        Shipment.status == "in_transit",
        Shipment.created_at < one_day_ago
    ).count()

    delayed_deliveries = delivered_delayed + in_transit_delayed

    # 5. Average Trip Distance (calculated using haversine on coordinates)
    trips = db.query(Trip).all()
    total_distance = 0.0
    valid_distance_trips = 0

    for t in trips:
        # Get start coordinates
        if t.pickup_latitude is not None and t.pickup_longitude is not None:
            lat1, lon1 = t.pickup_latitude, t.pickup_longitude
        else:
            lat1, lon1 = get_local_coords(t.shipment_origin)
            
        # Get end coordinates
        if t.destination_latitude is not None and t.destination_longitude is not None:
            lat2, lon2 = t.destination_latitude, t.destination_longitude
        else:
            lat2, lon2 = get_local_coords(t.shipment_destination)

        dist = haversine_distance(lat1, lon1, lat2, lon2)
        total_distance += dist
        valid_distance_trips += 1

    avg_distance = total_distance / valid_distance_trips if valid_distance_trips > 0 else 0.0

    # 6. Average Delivery Time (in Hours)
    delivered_shipments = db.query(Shipment).filter(
        Shipment.status == "delivered",
        Shipment.delivered_at != None
    ).all()

    total_time_hours = 0.0
    delivered_count = len(delivered_shipments)
    for s in delivered_shipments:
        time_diff = s.delivered_at - s.created_at
        total_time_hours += time_diff.total_seconds() / 3600.0

    avg_delivery_time = total_time_hours / delivered_count if delivered_count > 0 else 0.0

    return OperationalAnalyticsResponse(
        total_deliveries=total_deliveries,
        successful_deliveries=successful_deliveries,
        delayed_deliveries=delayed_deliveries,
        cancelled_deliveries=cancelled_deliveries,
        average_trip_distance=round(avg_distance, 2),
        average_delivery_time=round(avg_delivery_time, 2),
    )
