from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Trip, Shipment, Driver, Vehicle
from app.dependencies import dispatcher_required
from app.services.geocoding_service import get_coordinates
from app.services.route_service import get_route
from app.services.eta_service import calculate_eta

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE TRIP
@router.post("/")
def create_trip(
    shipment_id: int,
    driver_id: int,
    vehicle_id: int,
    pickup_location: str,
    destination: str,
    scheduled_start_time: datetime,
    scheduled_end_time: datetime,
    trip_status: str,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    # Validate Shipment
    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    # Validate Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    # Prevent Driver Double Assignment
    existing_driver_trip = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.trip_status == "Active"
    ).first()

    if existing_driver_trip:
        return {"message": "Driver already has an active trip"}

    # Prevent Vehicle Double Assignment
    existing_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == vehicle_id,
        Trip.trip_status == "Active"
    ).first()

    if existing_vehicle_trip:
        return {"message": "Vehicle already has an active trip"}

    # Get pickup coordinates
    pickup_coordinates = get_coordinates(pickup_location)

    if not pickup_coordinates:
        return {"message": "Pickup location not found"}

    # Get destination coordinates
    destination_coordinates = get_coordinates(destination)

    if not destination_coordinates:
        return {"message": "Destination location not found"}

    # Create Trip
    trip = Trip(
        shipment_id=shipment_id,
        driver_id=driver_id,
        vehicle_id=vehicle_id,
        pickup_location=pickup_location,
        destination=destination,
        pickup_latitude=pickup_coordinates["latitude"],
        pickup_longitude=pickup_coordinates["longitude"],
        destination_latitude=destination_coordinates["latitude"],
        destination_longitude=destination_coordinates["longitude"],
        scheduled_start_time=scheduled_start_time,
        scheduled_end_time=scheduled_end_time,
        trip_status=trip_status
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return {
        "message": "Trip created successfully",
        "trip": trip
    }


# GET ALL TRIPS
@router.get("/")
def get_all_trips(
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):
    return db.query(Trip).all()


# GET TRIP BY ID
@router.get("/{trip_id}")
def get_trip(
    trip_id: int,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if not trip:
        return {"message": "Trip not found"}

    return trip


# UPDATE TRIP
@router.put("/{trip_id}")
def update_trip(
    trip_id: int,
    shipment_id: int,
    driver_id: int,
    vehicle_id: int,
    pickup_location: str,
    destination: str,
    scheduled_start_time: datetime,
    scheduled_end_time: datetime,
    trip_status: str,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if not trip:
        return {"message": "Trip not found"}

    # Validate Shipment
    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    # Validate Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}
    pickup_coordinates = get_coordinates(pickup_location)

    if not pickup_coordinates:
        return {"message": "Pickup location not found"}

    destination_coordinates = get_coordinates(destination)

    if not destination_coordinates:
        return {"message": "Destination location not found"}

    trip.shipment_id = shipment_id
    trip.driver_id = driver_id
    trip.vehicle_id = vehicle_id
    trip.pickup_location = pickup_location
    trip.destination = destination
    trip.pickup_latitude = pickup_coordinates["latitude"]
    trip.pickup_longitude = pickup_coordinates["longitude"]

    trip.destination_latitude = destination_coordinates["latitude"]
    trip.destination_longitude = destination_coordinates["longitude"]
    trip.scheduled_start_time = scheduled_start_time
    trip.scheduled_end_time = scheduled_end_time
    trip.trip_status = trip_status

    db.commit()
    db.refresh(trip)

    return {
        "message": "Trip updated successfully",
        "trip": trip
    }


# DELETE TRIP
@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if not trip:
        return {"message": "Trip not found"}

    db.delete(trip)
    db.commit()

    return {
        "message": "Trip deleted successfully"
    }

@router.get("/{trip_id}/eta")
def get_trip_eta(
    trip_id: int,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if not trip:
        return {"message": "Trip not found"}

    route = get_route(
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude
    )

    if not route:
        return {"message": "Route not found"}

    eta = calculate_eta(
        route["estimated_duration_minutes"]
    )

    return {
        "trip_id": trip.id,
        "distance": f'{route["distance_km"]} km',
        "estimated_travel_duration": f'{route["estimated_duration_minutes"]} minutes',
        "estimated_arrival_time": eta
    }