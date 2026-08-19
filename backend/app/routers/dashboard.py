<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment, Trip, Maintenance, FuelRecord
from app.dependencies import dashboard_required
from app.enums import ShipmentStatus
=======
from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Driver, Vehicle, Shipment
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


<<<<<<< HEAD
# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# ROLE CHECK
# ============================================================

def dashboard_access(user: dict):

    allowed_roles = [
        "Administrator",
        "Fleet Manager",
        "Dispatcher"
    ]

    if user.get("role") not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access the dashboard"
        )

    return user


# ============================================================
# FLEET DASHBOARD
# ============================================================

@router.get("/fleet")
def get_dashboard(
    db: Session = Depends(get_db),
    user=Depends(dashboard_required)
):

    # ========================================================
    # VEHICLES
    # ========================================================

    total_vehicles = db.query(Vehicle).count()

    active_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Assigned"
    ).count()

    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    vehicles_under_maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()


    # ========================================================
    # DRIVERS
    # ========================================================

    total_drivers = db.query(Driver).count()

    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()

    assigned_drivers = db.query(Driver).filter(
        Driver.status == "Assigned"
    ).count()


    # ========================================================
    # TRIPS
    # ========================================================

    total_trips = db.query(Trip).count()

    completed_trips = db.query(Trip).filter(
        Trip.trip_status == "Completed"
    ).count()

    active_trips = db.query(Trip).filter(
        Trip.trip_status == "Active"
    ).count()

    cancelled_trips = db.query(Trip).filter(
        Trip.trip_status == "Cancelled"
    ).count()


    # ========================================================
    # SHIPMENTS
    # ========================================================

    total_shipments = db.query(Shipment).count()

    active_shipments = db.query(Shipment).filter(
        Shipment.current_status.in_([
            ShipmentStatus.ASSIGNED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY
        ])
    ).count()

    delivered_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELIVERED
    ).count()

    delayed_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.DELAYED
    ).count()

    cancelled_shipments = db.query(Shipment).filter(
        Shipment.current_status == ShipmentStatus.CANCELLED
    ).count()


    # ========================================================
    # FUEL
    # ========================================================

    total_fuel_records = db.query(FuelRecord).count()


    # ========================================================
    # MAINTENANCE
    # ========================================================

    total_maintenance = db.query(Maintenance).count()

    completed_maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_status == "Completed"
    ).count()

    pending_maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_status != "Completed"
    ).count()


    # ========================================================
    # RECENT TRIPS
    # ========================================================

    recent_trips = (
        db.query(Trip)
        .order_by(Trip.created_at.desc())
        .limit(5)
        .all()
    )

    recent_trips_data = [
        {
            "id": trip.id,
            "driver_id": trip.driver_id,
            "vehicle_id": trip.vehicle_id,
            "trip_status": trip.trip_status
        }
        for trip in recent_trips
    ]


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        # Vehicles
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_under_maintenance":
            vehicles_under_maintenance,

        # Drivers
        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "assigned_drivers": assigned_drivers,

        # Trips
        "total_trips": total_trips,
        "active_trips": active_trips,
        "completed_trips": completed_trips,
        "cancelled_trips": cancelled_trips,

        # Shipments
        "total_shipments": total_shipments,
        "active_shipments": active_shipments,
        "delivered_shipments": delivered_shipments,
        "delayed_shipments": delayed_shipments,
        "cancelled_shipments": cancelled_shipments,

        # Fuel
        "total_fuel_records": total_fuel_records,

        # Maintenance
        "total_maintenance": total_maintenance,
        "completed_maintenance": completed_maintenance,
        "pending_maintenance": pending_maintenance,

        # Recent Trips
        "recent_trips": recent_trips_data
    }


# ============================================================
# OPERATIONAL ANALYTICS
# ============================================================

@router.get("/analytics/operations")
def operational_analytics(
    db: Session = Depends(get_db),
    user=Depends(dashboard_required)
):

    dashboard_access(user)


    # ========================================================
    # TOTAL DELIVERIES
    # ========================================================

    total_deliveries = db.query(Shipment).count()


    # ========================================================
    # SUCCESSFUL DELIVERIES
    # ========================================================

    successful_deliveries = db.query(
        Shipment
    ).filter(
        Shipment.current_status == ShipmentStatus.DELIVERED
    ).count()


    # ========================================================
    # DELAYED DELIVERIES
    # ========================================================

    delayed_deliveries = db.query(
        Shipment
    ).filter(
        Shipment.current_status == ShipmentStatus.DELAYED
    ).count()


    # ========================================================
    # CANCELLED DELIVERIES
    # ========================================================

    cancelled_deliveries = db.query(
        Shipment
    ).filter(
        Shipment.current_status == ShipmentStatus.CANCELLED
    ).count()


    # ========================================================
    # AVERAGE TRIP DISTANCE
    # ========================================================

    trips = db.query(Trip).all()

    total_distance = 0
    distance_count = 0

    for trip in trips:

        if (
            trip.pickup_latitude is not None
            and trip.pickup_longitude is not None
            and trip.destination_latitude is not None
            and trip.destination_longitude is not None
        ):

            distance = (
                abs(
                    trip.destination_latitude
                    - trip.pickup_latitude
                )
                +
                abs(
                    trip.destination_longitude
                    - trip.pickup_longitude
                )
            )

            total_distance += distance
            distance_count += 1


    if distance_count > 0:
        average_trip_distance = (
            total_distance / distance_count
        )
    else:
        average_trip_distance = 0


    # ========================================================
    # AVERAGE DELIVERY TIME
    # ========================================================

    completed_trips = db.query(
        Trip
    ).filter(
        Trip.scheduled_start_time.isnot(None),
        Trip.scheduled_end_time.isnot(None),
        Trip.trip_status == "Completed"
    ).all()

    total_hours = 0
    trip_count = 0

    for trip in completed_trips:

        duration = (
            trip.scheduled_end_time
            - trip.scheduled_start_time
        ).total_seconds() / 3600

        # Ignore invalid negative durations
        if duration >= 0:
            total_hours += duration
            trip_count += 1


    if trip_count > 0:
        average_delivery_time = (
            total_hours / trip_count
        )
    else:
        average_delivery_time = 0


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "total_deliveries":
            total_deliveries,

        "successful_deliveries":
            successful_deliveries,

        "delayed_deliveries":
            delayed_deliveries,

        "cancelled_deliveries":
            cancelled_deliveries,

        "average_trip_distance":
            round(
                average_trip_distance,
                2
            ),

        "average_delivery_time_hours":
            round(
                average_delivery_time,
                2
            )
=======
@router.get("/")
def get_dashboard():
    db = SessionLocal()

    total_drivers = db.query(Driver).count()
    total_vehicles = db.query(Vehicle).count()
    total_shipments = db.query(Shipment).count()

    delivered_shipments = db.query(Shipment).filter(
        Shipment.status == "Delivered"
    ).count()

    pending_shipments = db.query(Shipment).filter(
        Shipment.status == "Pending"
    ).count()

    low_fuel_vehicles = db.query(Vehicle).filter(
        Vehicle.fuel_level < 20
    ).count()

    db.close()

    return {
        "total_drivers": total_drivers,
        "total_vehicles": total_vehicles,
        "total_shipments": total_shipments,
        "delivered_shipments": delivered_shipments,
        "pending_shipments": pending_shipments,
        "low_fuel_vehicles": low_fuel_vehicles
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    }