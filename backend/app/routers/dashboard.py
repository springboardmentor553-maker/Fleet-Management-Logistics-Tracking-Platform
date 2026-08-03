from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment, Trip
from app.dependencies import administrator_required
from app.enums import ShipmentStatus
from sqlalchemy import or_

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/fleet")
def get_dashboard(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
    # Vehicles
    total_vehicles = db.query(Vehicle).count()

    active_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Assigned"
    ).count()

    vehicles_under_maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()

    # Drivers
    total_drivers = db.query(Driver).count()

    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()

    assigned_drivers = db.query(Driver).filter(
        Driver.status == "Assigned"
    ).count()

    # Trips
    total_trips = db.query(Trip).count()

    completed_trips = db.query(Trip).filter(
        Trip.trip_status == "Completed"
    ).count()

    # Active Shipments
    active_shipments = db.query(Shipment).filter(
        Shipment.current_status.in_([
            ShipmentStatus.ASSIGNED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY
        ])
    ).count()

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "vehicles_under_maintenance": vehicles_under_maintenance,

        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "assigned_drivers": assigned_drivers,

        "total_trips": total_trips,
        "completed_trips": completed_trips,

        "active_shipments": active_shipments
    }

@router.get("/analytics/operations")
def operational_analytics(
    db: Session = Depends(get_db),
    user=Depends(administrator_required)
):
    # Total Deliveries
    total_deliveries = db.query(Shipment).count()

    # Successful Deliveries
    successful_deliveries = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELIVERED
    ).count()

    # Delayed Deliveries
    delayed_deliveries = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELAYED
    ).count()

    # Cancelled Deliveries
    cancelled_deliveries = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.CANCELLED
    ).count()

    # Average Trip Distance
    trips = db.query(Trip).all()

    total_distance = 0
    distance_count = 0

    for trip in trips:
        if (
            trip.pickup_latitude is not None and
            trip.pickup_longitude is not None and
            trip.destination_latitude is not None and
            trip.destination_longitude is not None
        ):
            distance = (
                abs(trip.destination_latitude - trip.pickup_latitude) +
                abs(trip.destination_longitude - trip.pickup_longitude)
            )

            total_distance += distance
            distance_count += 1

    average_trip_distance = (
        total_distance / distance_count
        if distance_count > 0 else 0
    )

    # Average Delivery Time
    completed_trips = db.query(Trip).filter(
        Trip.scheduled_start_time != None,
        Trip.scheduled_end_time != None
    ).all()

    total_hours = 0
    trip_count = 0

    for trip in completed_trips:
        duration = (
            trip.scheduled_end_time -
            trip.scheduled_start_time
        ).total_seconds() / 3600

        total_hours += duration
        trip_count += 1

    average_delivery_time = (
        total_hours / trip_count
        if trip_count > 0 else 0
    )

    return {
        "total_deliveries": total_deliveries,
        "successful_deliveries": successful_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "cancelled_deliveries": cancelled_deliveries,
        "average_trip_distance": round(average_trip_distance, 2),
        "average_delivery_time_hours": round(average_delivery_time, 2)
    }