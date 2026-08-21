from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.dependencies import get_db, require_role

from app.models.user import User
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.driver_assignment import DriverAssignment
from app.models.maintenance import Maintenance
from app.models.fuel_record import FuelRecord

from app.services.directions import get_route
from app.services.eta_service import calculate_eta


router = APIRouter()


# ============================================================
# HELPER - NORMALIZE TEXT
# ============================================================

def normalize_text(value):
    """
    Normalize text so comparisons are not affected by:
    - uppercase/lowercase
    - leading/trailing spaces
    - multiple spaces
    """

    if value is None:
        return ""

    return " ".join(
        str(value).strip().lower().split()
    )


# ============================================================
# HELPER - NORMALIZE STATUS
# ============================================================

def normalize_status(value):
    """
    Handles both normal strings and SQLAlchemy Enum values.

    Examples:
        COMPLETED
        TripStatus.COMPLETED
        Status.COMPLETED

    All are converted to:
        COMPLETED
    """

    if value is None:
        return ""

    if hasattr(value, "value"):
        value = value.value

    value = str(value)

    if "." in value:
        value = value.split(".")[-1]

    return value.strip().upper()


# ============================================================
# FIND DRIVER FOR LOGGED-IN USER
# ============================================================

def get_driver_for_user(
    current_user: User,
    db: Session,
):
    """
    Find the Driver record belonging to the logged-in user.

    The current database does not have a user_id foreign key
    inside the drivers table.

    Therefore, the existing project relationship is preserved
    by matching the authenticated user's name with Driver.name.

    Matching is normalized for:
    - uppercase/lowercase
    - leading/trailing spaces
    - repeated spaces
    """

    user_name = normalize_text(
        current_user.name
    )

    drivers = (
        db.query(Driver)
        .all()
    )

    for driver in drivers:

        driver_name = normalize_text(
            driver.name
        )

        if driver_name == user_name:
            return driver

    # --------------------------------------------------------
    # Driver was not found
    # --------------------------------------------------------

    available_driver_names = [
        driver.name
        for driver in drivers
    ]

    raise HTTPException(
        status_code=404,
        detail={
            "message": "Driver profile not found.",
            "logged_in_user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role,
            },
            "available_driver_names": available_driver_names,
            "solution": (
                "The logged-in user's name must match "
                "one of the registered driver names."
            ),
        },
    )


# ============================================================
# VEHICLE SERIALIZER
# ============================================================

def vehicle_data(vehicle):

    if vehicle is None:
        return None

    return {
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_type": vehicle.vehicle_type,
        "capacity": vehicle.capacity,
        "status": vehicle.status,
        "fuel_type": vehicle.fuel_type,
        "model": vehicle.model,
        "manufacturer": vehicle.manufacturer,
    }


# ============================================================
# SHIPMENT SERIALIZER
# ============================================================

def shipment_data(shipment):

    return {
        "id": shipment.id,
        "tracking_number": shipment.tracking_number,
        "sender_name": shipment.sender_name,
        "receiver_name": shipment.receiver_name,
        "pickup_location": shipment.pickup_location,
        "delivery_location": shipment.delivery_location,
        "status": (
            shipment.status.value
            if hasattr(shipment.status, "value")
            else shipment.status
        ),
        "weight": shipment.weight,
        "created_date": shipment.created_date,
        "assigned_driver_id": shipment.assigned_driver_id,
        "assigned_vehicle_id": shipment.assigned_vehicle_id,
    }


# ============================================================
# TRIP SERIALIZER
# ============================================================

def trip_data(trip):

    shipment = trip.shipment

    return {
        "id": trip.id,
        "shipment_id": trip.shipment_id,
        "driver_id": trip.driver_id,
        "vehicle_id": trip.vehicle_id,
        "start_location": trip.start_location,
        "end_location": trip.end_location,
        "pickup_latitude": trip.pickup_latitude,
        "pickup_longitude": trip.pickup_longitude,
        "destination_latitude": trip.destination_latitude,
        "destination_longitude": trip.destination_longitude,
        "start_time": trip.start_time,
        "end_time": trip.end_time,
        "distance": trip.distance,
        "status": (
            trip.status.value
            if hasattr(trip.status, "value")
            else trip.status
        ),
        "shipment": (
            shipment_data(shipment)
            if shipment
            else None
        ),
    }


# ============================================================
# DRIVER DASHBOARD
#
# Driver can only see:
# - Own trips
# - Own shipments
# - Own/current vehicle
# - Maintenance of current vehicle
# - Fuel records of current vehicle
# ============================================================

@router.get("/")
def get_driver_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("driver")
    ),
):

    # --------------------------------------------------------
    # Find logged-in driver
    # --------------------------------------------------------

    driver = get_driver_for_user(
        current_user,
        db,
    )

    # --------------------------------------------------------
    # ALL DRIVER TRIPS
    # --------------------------------------------------------

    all_trips = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.id
        )
        .order_by(
            Trip.start_time.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # ACTIVE TRIP
    # --------------------------------------------------------

    active_trip = None

    for trip in all_trips:

        status = normalize_status(
            trip.status
        )

        if status in [
            "ONGOING",
            "IN_PROGRESS",
            "IN PROGRESS",
            "STARTED",
        ]:
            active_trip = trip
            break

    # --------------------------------------------------------
    # COMPLETED / CANCELLED TRIPS
    # --------------------------------------------------------

    completed_trips = [
        trip
        for trip in all_trips
        if normalize_status(
            trip.status
        ) == "COMPLETED"
    ]

    cancelled_trips = [
        trip
        for trip in all_trips
        if normalize_status(
            trip.status
        ) == "CANCELLED"
    ]

    # --------------------------------------------------------
    # CURRENT DRIVER ASSIGNMENT
    # --------------------------------------------------------

    active_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.driver_id == driver.id,
            DriverAssignment.assignment_status == "ASSIGNED",
        )
        .order_by(
            DriverAssignment.assignment_date.desc()
        )
        .first()
    )

    # --------------------------------------------------------
    # ASSIGNED VEHICLE
    #
    # Priority:
    # 1. Vehicle of active trip
    # 2. Vehicle of active driver assignment
    # --------------------------------------------------------

    assigned_vehicle = None

    if active_trip:

        assigned_vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id
                == active_trip.vehicle_id
            )
            .first()
        )

    elif active_assignment:

        assigned_vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id
                == active_assignment.vehicle_id
            )
            .first()
        )

    # --------------------------------------------------------
    # DRIVER SHIPMENTS
    #
    # Include:
    # 1. Shipments explicitly assigned to driver
    # 2. Shipments connected to driver's trips
    # --------------------------------------------------------

    driver_trip_shipment_ids = [
        trip.shipment_id
        for trip in all_trips
        if trip.shipment_id is not None
    ]

    shipment_conditions = [
        Shipment.assigned_driver_id == driver.id
    ]

    if driver_trip_shipment_ids:

        shipment_conditions.append(
            Shipment.id.in_(
                driver_trip_shipment_ids
            )
        )

    shipment_query = (
        db.query(Shipment)
        .filter(
            or_(
                *shipment_conditions
            )
        )
        .all()
    )

    # --------------------------------------------------------
    # REMOVE DUPLICATE SHIPMENTS
    # --------------------------------------------------------

    shipment_map = {
        shipment.id: shipment
        for shipment in shipment_query
    }

    my_shipments = list(
        shipment_map.values()
    )

    # --------------------------------------------------------
    # MAINTENANCE HISTORY
    # --------------------------------------------------------

    maintenance_records = []

    if assigned_vehicle:

        maintenance_records = (
            db.query(Maintenance)
            .filter(
                Maintenance.vehicle_id
                == assigned_vehicle.id
            )
            .order_by(
                Maintenance.service_date.desc()
            )
            .all()
        )

    # --------------------------------------------------------
    # FUEL HISTORY
    # --------------------------------------------------------

    fuel_records = []

    if assigned_vehicle:

        fuel_records = (
            db.query(FuelRecord)
            .filter(
                FuelRecord.vehicle_id
                == assigned_vehicle.id
            )
            .order_by(
                FuelRecord.fuel_date.desc()
            )
            .all()
        )

    # --------------------------------------------------------
    # CURRENT TRIP ROUTE
    #
    # Uses the existing Google Maps route service.
    # No new tracking architecture is introduced.
    # --------------------------------------------------------

    current_trip_data = None

    if active_trip:

        current_trip_data = trip_data(
            active_trip
        )

        current_trip_data["route"] = None

        if (
            active_trip.pickup_latitude
            is not None
            and active_trip.pickup_longitude
            is not None
            and active_trip.destination_latitude
            is not None
            and active_trip.destination_longitude
            is not None
        ):

            try:

                route = get_route(
                    active_trip.pickup_latitude,
                    active_trip.pickup_longitude,
                    active_trip.destination_latitude,
                    active_trip.destination_longitude,
                )

                eta = calculate_eta(
                    route["duration_seconds"]
                )

                current_trip_data["route"] = {
                    "distance": route[
                        "distance_text"
                    ],
                    "estimated_travel_time": route[
                        "duration_text"
                    ],
                    "route_summary": route.get(
                        "summary",
                        "No route summary available",
                    ),
                    "polyline": route.get(
                        "polyline"
                    ),
                    "eta": eta.get(
                        "estimated_arrival_time"
                    ),
                }

            except Exception:
                current_trip_data["route"] = None

    # --------------------------------------------------------
    # RETURN DRIVER DASHBOARD
    # --------------------------------------------------------

    return {

        # ----------------------------------------------------
        # DRIVER
        # ----------------------------------------------------

        "driver": {
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "license_number": driver.license_number,
            "status": driver.status,
        },

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        "summary": {
            "active_trips": (
                1
                if active_trip
                else 0
            ),
            "completed_trips": len(
                completed_trips
            ),
            "cancelled_trips": len(
                cancelled_trips
            ),
            "total_trips": len(
                all_trips
            ),
            "shipments": len(
                my_shipments
            ),
        },

        # ----------------------------------------------------
        # ACTIVE TRIP
        # ----------------------------------------------------

        "active_trip": current_trip_data,

        # ----------------------------------------------------
        # ASSIGNED VEHICLE
        # ----------------------------------------------------

        "assigned_vehicle": vehicle_data(
            assigned_vehicle
        ),

        # ----------------------------------------------------
        # COMPLETED TRIPS
        # ----------------------------------------------------

        "completed_trips": [
            trip_data(trip)
            for trip in completed_trips
        ],

        # ----------------------------------------------------
        # CANCELLED TRIPS
        # ----------------------------------------------------

        "cancelled_trips": [
            trip_data(trip)
            for trip in cancelled_trips
        ],

        # ----------------------------------------------------
        # COMPLETE TRIP HISTORY
        # ----------------------------------------------------

        "trip_history": [
            trip_data(trip)
            for trip in all_trips
        ],

        # ----------------------------------------------------
        # MY SHIPMENTS
        # ----------------------------------------------------

        "shipments": [
            shipment_data(shipment)
            for shipment in my_shipments
        ],

        # ----------------------------------------------------
        # MAINTENANCE
        # ----------------------------------------------------

        "maintenance": [
            {
                "id": record.id,
                "vehicle_id": record.vehicle_id,
                "maintenance_category": (
                    record.maintenance_category.value
                    if hasattr(
                        record.maintenance_category,
                        "value",
                    )
                    else record.maintenance_category
                ),
                "service_date": record.service_date,
                "next_service_date": record.next_service_date,
                "service_cost": record.service_cost,
                "service_provider": record.service_provider,
                "maintenance_status": (
                    record.maintenance_status.value
                    if hasattr(
                        record.maintenance_status,
                        "value",
                    )
                    else record.maintenance_status
                ),
                "notes": record.notes,
                "created_at": record.created_at,
            }
            for record in maintenance_records
        ],

        # ----------------------------------------------------
        # FUEL
        # ----------------------------------------------------

        "fuel": [
            {
                "id": record.id,
                "vehicle_id": record.vehicle_id,
                "driver_id": record.driver_id,
                "fuel_quantity": record.fuel_quantity,
                "fuel_cost": record.fuel_cost,
                "odometer_reading": record.odometer_reading,
                "fuel_date": record.fuel_date,
                "fuel_station": record.fuel_station,
                "remarks": record.remarks,
            }
            for record in fuel_records
        ],
    }