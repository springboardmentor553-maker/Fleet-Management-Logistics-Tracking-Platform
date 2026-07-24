from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role

from app.models.user import User
from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.enums import ShipmentStatus
from app.services.google_maps import get_coordinates
from app.services.directions import get_route

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    RouteResponse,
)

from app.schemas.common import MessageResponse


router = APIRouter()


# -----------------------------
# Add Trip
# Admin + Fleet Manager + Dispatcher
# -----------------------------
@router.post("/", response_model=TripResponse)
def add_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    )
):

    # -----------------------------
    # Validate Shipment
    # -----------------------------
    shipment = db.query(Shipment).filter(
        Shipment.id == trip.shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found."
        )

    # -----------------------------
    # Shipment already assigned?
    # -----------------------------
    existing_trip = db.query(Trip).filter(
        Trip.shipment_id == trip.shipment_id
    ).first()

    if existing_trip:
        raise HTTPException(
            status_code=400,
            detail="Shipment is already assigned to a trip."
        )

    # -----------------------------
    # Validate Driver
    # -----------------------------
    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    # -----------------------------
    # Validate Vehicle
    # -----------------------------
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    # -----------------------------
    # Driver already on active trip?
    # -----------------------------
    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == trip.driver_id,
        Trip.status == "ONGOING"
    ).first()

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip."
        )

    # -----------------------------
    # Vehicle already on active trip?
    # -----------------------------
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == trip.vehicle_id,
        Trip.status == "ONGOING"
    ).first()

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip."
        )

        # -----------------------------
    # Get Pickup & Destination Coordinates
    # -----------------------------
    try:
        pickup_latitude, pickup_longitude = get_coordinates(
            trip.start_location
        )

        destination_latitude, destination_longitude = get_coordinates(
            trip.end_location
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # -----------------------------
    # Get Route Information
    # -----------------------------
    route = get_route(
    pickup_latitude,
    pickup_longitude,
    destination_latitude,
    destination_longitude,
    )
    print("Distance:", route["distance_text"])
    print("Duration:", route["duration_text"])
    print("Polyline:", route["polyline"])
    
    # -----------------------------
    # Create Trip
    # -----------------------------
    new_trip = Trip(
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,

        start_location=trip.start_location,
        end_location=trip.end_location,

        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,

        destination_latitude=destination_latitude,
        destination_longitude=destination_longitude,

        start_time=trip.start_time,
        end_time=trip.end_time,

        distance=route["distance_meters"] / 1000,
        status=trip.status,
        )

    # -----------------------------
    # Assign Shipment to Trip
    # -----------------------------
    shipment.status = ShipmentStatus.ASSIGNED

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return new_trip

# -----------------------------
# View All Trips
# -----------------------------
@router.get("/", response_model=list[TripResponse])
def get_all_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    )
):
    return db.query(Trip).all()

# -----------------------------
# View Single Trip
# -----------------------------
@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
            "driver",
        )
    )
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )

    return trip

# -----------------------------
# Update Trip
# -----------------------------
@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    trip: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    )
):
    db_trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if db_trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )

    update_data = trip.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_trip, key, value)

    db.commit()
    db.refresh(db_trip)

    return db_trip

# -----------------------------
# Delete Trip
# -----------------------------
@router.delete("/{trip_id}", response_model=MessageResponse)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    )
):
    db_trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if db_trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )

    # Make the shipment available again
    shipment = db.query(Shipment).filter(
        Shipment.id == db_trip.shipment_id
    ).first()

    if shipment:
        shipment.status = ShipmentStatus.CREATED

    db.delete(db_trip)
    db.commit()

    return {
        "message": "Trip deleted successfully."
    }

# -----------------------------
# Get Route Details
# -----------------------------
@router.get("/{trip_id}/route", response_model=RouteResponse)
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
            "driver",
        )
    ),
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )

    route = get_route(
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude,
    )

    print(route)

    return {
    "pickup_location": trip.start_location,
    "destination": trip.end_location,
    "distance": route["distance_text"],
    "estimated_travel_time": route["duration_text"],
    "route_summary": route.get("summary", "No route summary available"),
    }