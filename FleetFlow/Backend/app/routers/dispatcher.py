from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles

from app.models.user import User
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver_assignment import DriverAssignment

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentAssign,
    ShipmentResponse,
)

from app.services.maps import geocode_location


router = APIRouter(
    prefix="/dispatcher",
    tags=["Dispatcher"],
)


_dispatch_or_admin = require_roles(
    Role.DISPATCHER,
    Role.ADMIN,
)


# ============================================================
# GET ALL SHIPMENTS
# ============================================================

@router.get(
    "/shipments",
    response_model=list[ShipmentResponse],
)
def list_shipments(
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    return (
        db.query(Shipment)
        .order_by(Shipment.id)
        .all()
    )


# ============================================================
# CREATE SHIPMENT
# ============================================================

@router.post(
    "/shipments",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = Shipment(
        **data.model_dump()
    )

    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    return shipment


# ============================================================
# ASSIGN DRIVER + VEHICLE TO SHIPMENT
# ============================================================

@router.patch(
    "/shipments/{shipment_id}/assign",
    response_model=ShipmentResponse,
)
def assign_shipment(
    shipment_id: int,
    data: ShipmentAssign,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):

    # ========================================================
    # 1. FIND SHIPMENT
    # ========================================================

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # ========================================================
    # 2. SHIPMENT MUST BE PENDING
    # ========================================================

    if shipment.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending shipments can be assigned",
        )

    # ========================================================
    # DRIVER VALIDATION
    # ========================================================

    # --------------------------------------------------------
    # 3. FIND DRIVER
    # --------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == data.driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # --------------------------------------------------------
    # 4. DRIVER ON LEAVE
    # --------------------------------------------------------

    if driver.attendance_status == "on_leave":
        raise HTTPException(
            status_code=400,
            detail="Driver is on leave",
        )

    # --------------------------------------------------------
    # 5. DRIVER ACTIVE TRIP VALIDATION
    # --------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.id,
            Trip.status.in_(
                [
                    "scheduled",
                    "started",
                    "in_transit",
                ]
            ),
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip",
        )

    # --------------------------------------------------------
    # 6. DRIVER AVAILABILITY
    # --------------------------------------------------------

    if not driver.is_available:
        raise HTTPException(
            status_code=400,
            detail="Driver is unavailable",
        )

    # ========================================================
    # VEHICLE VALIDATION
    # ========================================================

    # --------------------------------------------------------
    # 7. FIND VEHICLE
    # --------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == data.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # --------------------------------------------------------
    # 8. VEHICLE AVAILABILITY
    # --------------------------------------------------------

    if vehicle.current_status != "available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is unavailable",
        )

    # --------------------------------------------------------
    # 9. VEHICLE ACTIVE TRIP VALIDATION
    # --------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status.in_(
                [
                    "scheduled",
                    "started",
                    "in_transit",
                ]
            ),
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip",
        )

    # ========================================================
    # GEOCODING
    # ========================================================

    # --------------------------------------------------------
    # 10. GEOCODE ORIGIN
    # --------------------------------------------------------

    if (
        shipment.origin_lat is None
        or shipment.origin_lng is None
    ):
        origin = geocode_location(
            shipment.origin
        )

        shipment.origin_lat = origin["latitude"]
        shipment.origin_lng = origin["longitude"]

    # --------------------------------------------------------
    # 11. GEOCODE DESTINATION
    # --------------------------------------------------------

    if (
        shipment.destination_lat is None
        or shipment.destination_lng is None
    ):
        destination = geocode_location(
            shipment.destination
        )

        shipment.destination_lat = destination["latitude"]
        shipment.destination_lng = destination["longitude"]

    # ========================================================
    # UPDATE SHIPMENT
    # ========================================================

    shipment.driver_id = driver.id
    shipment.vehicle_id = vehicle.id
    shipment.status = "in_transit"

    # ========================================================
    # UPDATE DRIVER
    # ========================================================

    driver.is_available = False
    driver.assigned_vehicle_id = vehicle.id

    # ========================================================
    # UPDATE VEHICLE
    # ========================================================

    vehicle.current_status = "in_transit"
    vehicle.assigned_driver_id = driver.id

    vehicle.latitude = shipment.origin_lat
    vehicle.longitude = shipment.origin_lng

    # ========================================================
    # CREATE TRIP
    # ========================================================

    trip = Trip(
        shipment_id=shipment.id,
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        pickup_latitude=shipment.origin_lat,
        pickup_longitude=shipment.origin_lng,
        destination_latitude=shipment.destination_lat,
        destination_longitude=shipment.destination_lng,
        status="scheduled",
    )

    db.add(trip)

    # Generate trip ID
    db.flush()

    # ========================================================
    # CREATE DRIVER ASSIGNMENT
    # ========================================================

    assignment = DriverAssignment(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        trip_id=trip.id,
        assignment_date=datetime.utcnow(),
        assignment_status="Assigned",
        remarks="Assigned from Dispatcher",
    )

    db.add(assignment)

    # ========================================================
    # COMMIT ALL CHANGES
    # ========================================================

    db.commit()

    db.refresh(shipment)

    try:
        from app.services.notification_service import notify_driver_event
        notify_driver_event(
            db=db,
            driver=driver,
            title=f"👤 Driver Assignment — {driver.name}",
            message=f"You have been assigned to Vehicle '{vehicle.plate_number}' for Shipment #{shipment.id} (Trip #{trip.id}) from {shipment.origin} to {shipment.destination}.",
            category="driver_assignment",
            priority="high",
            reference_type="driver",
            reference_id=driver.id,
            channel_email=True,
            channel_sms=True,
            channel_push=True,
        )
    except Exception:
        pass

    return shipment


# ============================================================
# CANCEL SHIPMENT
# ============================================================

@router.patch(
    "/shipments/{shipment_id}/cancel",
    response_model=ShipmentResponse,
)
def cancel_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):

    # ========================================================
    # 1. FIND SHIPMENT
    # ========================================================

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # ========================================================
    # 2. CANNOT CANCEL DELIVERED/CANCELLED SHIPMENT
    # ========================================================

    if shipment.status in (
        "delivered",
        "cancelled",
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot cancel a "
                f"{shipment.status} shipment"
            ),
        )

    # ========================================================
    # FIND ASSOCIATED TRIP
    # ========================================================

    trip = (
        db.query(Trip)
        .filter(
            Trip.shipment_id == shipment.id
        )
        .first()
    )

    # ========================================================
    # UPDATE TRIP + ASSIGNMENT
    # ========================================================

    if trip:

        trip.status = "cancelled"

        assignment = (
            db.query(DriverAssignment)
            .filter(
                DriverAssignment.trip_id == trip.id
            )
            .first()
        )

        if assignment:
            assignment.assignment_status = "Cancelled"

    # ========================================================
    # RELEASE DRIVER
    # ========================================================

    if shipment.driver_id:

        driver = (
            db.query(Driver)
            .filter(
                Driver.id == shipment.driver_id
            )
            .first()
        )

        if driver:
            driver.is_available = True
            driver.assigned_vehicle_id = None

    # ========================================================
    # RELEASE VEHICLE
    # ========================================================

    if shipment.vehicle_id:

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == shipment.vehicle_id
            )
            .first()
        )

        if vehicle:
            vehicle.current_status = "available"
            vehicle.assigned_driver_id = None

    # ========================================================
    # UPDATE SHIPMENT
    # ========================================================

    shipment.status = "cancelled"

    # ========================================================
    # COMMIT
    # ========================================================

    db.commit()

    db.refresh(shipment)

    return shipment