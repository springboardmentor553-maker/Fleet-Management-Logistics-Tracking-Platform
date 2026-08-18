from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from math import radians, sin, cos, sqrt, atan2

import requests

from app import models
from app.database import get_db
from app.schemas.trip import (
    TripCreate,
    TripRead,
    TripUpdate,
)


router = APIRouter()


# =========================================================
# HELPER — CALCULATE STRAIGHT-LINE DISTANCE
# =========================================================

def calculate_distance_km(
    lat1,
    lon1,
    lat2,
    lon2,
):
    """
    Calculate approximate distance between two
    latitude/longitude points using Haversine formula.
    """

    # Handle missing coordinates
    if any(
        value is None
        or str(value).strip() == ""
        for value in (
            lat1,
            lon1,
            lat2,
            lon2,
        )
    ):
        return 0.0

    try:
        lat1 = float(lat1)
        lon1 = float(lon1)
        lat2 = float(lat2)
        lon2 = float(lon2)

    except (TypeError, ValueError):
        return 0.0

    earth_radius = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)

    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return earth_radius * c


# =========================================================
# HELPER — CREATE ROUTE FOR TRIP
# =========================================================

def create_route_for_trip(
    trip,
    db,
):
    """
    Create a Route record for a trip when valid
    pickup and destination coordinates exist.

    If the route already exists, return it.
    If coordinates are missing or invalid, return None.
    """

    # -----------------------------------------------------
    # Check whether route already exists
    # -----------------------------------------------------

    existing_route = (
        db.query(models.Route)
        .filter(
            models.Route.trip_id == trip.id
        )
        .first()
    )

    if existing_route:
        return existing_route

    # -----------------------------------------------------
    # Collect coordinates
    # -----------------------------------------------------

    coordinates = [
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude,
    ]

    # -----------------------------------------------------
    # Reject None / empty values
    # -----------------------------------------------------

    if any(
        value is None
        or str(value).strip() == ""
        for value in coordinates
    ):
        return None

    # -----------------------------------------------------
    # Convert coordinates
    # -----------------------------------------------------

    try:

        source_latitude = float(
            trip.pickup_latitude
        )

        source_longitude = float(
            trip.pickup_longitude
        )

        destination_latitude = float(
            trip.destination_latitude
        )

        destination_longitude = float(
            trip.destination_longitude
        )

    except (TypeError, ValueError):

        return None

    # -----------------------------------------------------
    # Validate coordinate ranges
    # -----------------------------------------------------

    if not (
        -90 <= source_latitude <= 90
        and
        -180 <= source_longitude <= 180
        and
        -90 <= destination_latitude <= 90
        and
        -180 <= destination_longitude <= 180
    ):
        return None

    # -----------------------------------------------------
    # Calculate approximate distance
    # -----------------------------------------------------

    distance = calculate_distance_km(
        source_latitude,
        source_longitude,
        destination_latitude,
        destination_longitude,
    )

    # -----------------------------------------------------
    # Estimated travel time
    #
    # Average speed = 50 km/h
    # Result is stored in minutes.
    # -----------------------------------------------------

    average_speed_kmh = 50

    estimated_time = (
        distance / average_speed_kmh * 60
        if distance > 0
        else 0
    )

    # -----------------------------------------------------
    # Create Route
    # -----------------------------------------------------

    route = models.Route(

        trip_id=trip.id,

        source_latitude=source_latitude,

        source_longitude=source_longitude,

        destination_latitude=destination_latitude,

        destination_longitude=destination_longitude,

        distance=round(
            distance,
            2,
        ),

        estimated_time=round(
            estimated_time,
            2,
        ),
    )

    db.add(route)

    db.commit()

    db.refresh(route)

    return route


# =========================================================
# HELPER — TRIP RESPONSE
# =========================================================

def trip_to_response(trip):

    response = {

        "id":
            trip.id,

        "shipment_id":
            trip.shipment_id,

        "driver_id":
            trip.driver_id,

        "vehicle_id":
            trip.vehicle_id,

        "pickup_location":
            trip.pickup_location,

        "destination":
            trip.destination,

        "pickup_latitude":
            trip.pickup_latitude,

        "pickup_longitude":
            trip.pickup_longitude,

        "destination_latitude":
            trip.destination_latitude,

        "destination_longitude":
            trip.destination_longitude,

        "scheduled_start_time":
            trip.scheduled_start_time,

        "scheduled_end_time":
            trip.scheduled_end_time,

        "trip_status":
            trip.trip_status,
    }

    # -----------------------------------------------------
    # DRIVER
    # -----------------------------------------------------

    if trip.driver:

        response["driver"] = {

            "id":
                trip.driver.id,

            "name":
                trip.driver.name,

            "license_number":
                trip.driver.license_number,

            "phone":
                trip.driver.phone,

            "phone_number":
                trip.driver.phone_number,

            "status": (
                trip.driver.status.value
                if hasattr(
                    trip.driver.status,
                    "value",
                )
                else trip.driver.status
            ),
        }

    else:

        response["driver"] = None

    # -----------------------------------------------------
    # VEHICLE
    # -----------------------------------------------------

    if trip.vehicle:

        response["vehicle"] = {

            "id":
                trip.vehicle.id,

            "make":
                trip.vehicle.make,

            "model":
                trip.vehicle.model,

            "year":
                trip.vehicle.year,

            "license_plate":
                trip.vehicle.license_plate,

            "vin":
                trip.vehicle.vin,

            "status":
                trip.vehicle.status,
        }

    else:

        response["vehicle"] = None

    # -----------------------------------------------------
    # SHIPMENT
    # -----------------------------------------------------

    if trip.shipment:

        response["shipment"] = {

            "id":
                trip.shipment.id,
        }

        if hasattr(
            trip.shipment,
            "tracking_number",
        ):

            response["shipment"][
                "tracking_number"
            ] = (
                trip.shipment.tracking_number
            )

    else:

        response["shipment"] = None

    return response


# =========================================================
# GET ALL TRIPS
# =========================================================

@router.get("/")
def get_trips(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):

    trips = (
        db.query(models.Trip)
        .options(
            joinedload(
                models.Trip.driver
            ),

            joinedload(
                models.Trip.vehicle
            ),

            joinedload(
                models.Trip.shipment
            ),
        )
        .order_by(
            models.Trip.id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        trip_to_response(trip)
        for trip in trips
    ]


# =========================================================
# GET SINGLE TRIP
# =========================================================

@router.get("/{trip_id}")
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):

    trip = (
        db.query(models.Trip)
        .options(
            joinedload(
                models.Trip.driver
            ),

            joinedload(
                models.Trip.vehicle
            ),

            joinedload(
                models.Trip.shipment
            ),
        )
        .filter(
            models.Trip.id == trip_id
        )
        .first()
    )

    if not trip:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    return trip_to_response(trip)


# =========================================================
# CREATE TRIP
# =========================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Validate shipment
    # -----------------------------------------------------

    shipment = (
        db.query(models.Shipment)
        .filter(
            models.Shipment.id
            == payload.shipment_id
        )
        .first()
    )

    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # -----------------------------------------------------
    # Validate driver
    # -----------------------------------------------------

    driver = (
        db.query(models.Driver)
        .filter(
            models.Driver.id
            == payload.driver_id
        )
        .first()
    )

    if not driver:

        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # -----------------------------------------------------
    # Validate vehicle
    # -----------------------------------------------------

    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id
            == payload.vehicle_id
        )
        .first()
    )

    if not vehicle:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # -----------------------------------------------------
    # Create Trip
    # -----------------------------------------------------

    trip = models.Trip(
        **payload.model_dump()
    )

    db.add(trip)

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Unable to create trip: "
                f"{str(exc)}"
            ),
        )

    db.refresh(trip)

    # -----------------------------------------------------
    # Automatically create Route
    # -----------------------------------------------------

    create_route_for_trip(
        trip,
        db,
    )

    # -----------------------------------------------------
    # Reload Trip
    # -----------------------------------------------------

    trip = (
        db.query(models.Trip)
        .options(
            joinedload(
                models.Trip.driver
            ),

            joinedload(
                models.Trip.vehicle
            ),

            joinedload(
                models.Trip.shipment
            ),
        )
        .filter(
            models.Trip.id == trip.id
        )
        .first()
    )

    return trip_to_response(trip)


# =========================================================
# UPDATE TRIP
# =========================================================

@router.put("/{trip_id}")
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
):

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id == trip_id
        )
        .first()
    )

    if not trip:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Validate shipment
    # -----------------------------------------------------

    if "shipment_id" in update_data:

        shipment = (
            db.query(models.Shipment)
            .filter(
                models.Shipment.id
                == update_data[
                    "shipment_id"
                ]
            )
            .first()
        )

        if not shipment:

            raise HTTPException(
                status_code=404,
                detail="Shipment not found",
            )

    # -----------------------------------------------------
    # Validate driver
    # -----------------------------------------------------

    if "driver_id" in update_data:

        driver = (
            db.query(models.Driver)
            .filter(
                models.Driver.id
                == update_data[
                    "driver_id"
                ]
            )
            .first()
        )

        if not driver:

            raise HTTPException(
                status_code=404,
                detail="Driver not found",
            )

    # -----------------------------------------------------
    # Validate vehicle
    # -----------------------------------------------------

    if "vehicle_id" in update_data:

        vehicle = (
            db.query(models.Vehicle)
            .filter(
                models.Vehicle.id
                == update_data[
                    "vehicle_id"
                ]
            )
            .first()
        )

        if not vehicle:

            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

    # -----------------------------------------------------
    # Apply updates
    # -----------------------------------------------------

    for field, value in update_data.items():

        setattr(
            trip,
            field,
            value,
        )

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Unable to update trip: "
                f"{str(exc)}"
            ),
        )

    db.refresh(trip)

    # -----------------------------------------------------
    # Create Route if coordinates now exist
    # -----------------------------------------------------

    create_route_for_trip(
        trip,
        db,
    )

    # -----------------------------------------------------
    # Reload
    # -----------------------------------------------------

    trip = (
        db.query(models.Trip)
        .options(
            joinedload(
                models.Trip.driver
            ),

            joinedload(
                models.Trip.vehicle
            ),

            joinedload(
                models.Trip.shipment
            ),
        )
        .filter(
            models.Trip.id == trip_id
        )
        .first()
    )

    return trip_to_response(trip)


# =========================================================
# DELETE TRIP
# =========================================================

@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id == trip_id
        )
        .first()
    )

    if not trip:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # -----------------------------------------------------
    # Delete associated route first
    # -----------------------------------------------------

    route = (
        db.query(models.Route)
        .filter(
            models.Route.trip_id
            == trip_id
        )
        .first()
    )

    if route:

        db.delete(route)

    db.delete(trip)

    db.commit()

    return None


# =========================================================
# GET REAL ROAD ROUTE
# =========================================================

@router.get("/{trip_id}/route")
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find trip
    # -----------------------------------------------------

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id == trip_id
        )
        .first()
    )

    if not trip:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # -----------------------------------------------------
    # Find stored route
    # -----------------------------------------------------

    route = (
        db.query(models.Route)
        .filter(
            models.Route.trip_id
            == trip_id
        )
        .first()
    )

    # -----------------------------------------------------
    # Automatically create route if missing
    # -----------------------------------------------------

    if not route:

        route = create_route_for_trip(
            trip,
            db,
        )

    # -----------------------------------------------------
    # Still no route
    # -----------------------------------------------------

    if not route:

        raise HTTPException(
            status_code=404,
            detail=(
                "Route not found. "
                "Trip must have valid pickup "
                "and destination coordinates."
            ),
        )

    # -----------------------------------------------------
    # Convert stored coordinates
    # -----------------------------------------------------

    try:

        source_lat = float(
            route.source_latitude
        )

        source_lon = float(
            route.source_longitude
        )

        destination_lat = float(
            route.destination_latitude
        )

        destination_lon = float(
            route.destination_longitude
        )

    except (TypeError, ValueError):

        raise HTTPException(
            status_code=500,
            detail=(
                "Route contains invalid "
                "coordinates."
            ),
        )

    # -----------------------------------------------------
    # OSRM URL
    # -----------------------------------------------------

    osrm_url = (
        "https://router.project-osrm.org/"
        "route/v1/driving/"
        f"{source_lon},{source_lat};"
        f"{destination_lon},{destination_lat}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    # -----------------------------------------------------
    # Request OSRM
    # -----------------------------------------------------

    try:

        response = requests.get(
            osrm_url,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        osrm_data = response.json()

    except requests.RequestException as error:

        raise HTTPException(
            status_code=502,
            detail=(
                "Routing service unavailable: "
                f"{error}"
            ),
        )

    # -----------------------------------------------------
    # Validate OSRM response
    # -----------------------------------------------------

    if osrm_data.get("code") != "Ok":

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to calculate road route. "
                f"OSRM response: "
                f"{osrm_data.get('code')}"
            ),
        )

    if not osrm_data.get("routes"):

        raise HTTPException(
            status_code=502,
            detail="No road route found",
        )

    # -----------------------------------------------------
    # Get road route
    # -----------------------------------------------------

    road_route = (
        osrm_data["routes"][0]
    )

    geometry = road_route.get(
        "geometry"
    )

    if not geometry:

        raise HTTPException(
            status_code=502,
            detail=(
                "Road route geometry "
                "was not returned."
            ),
        )

    # -----------------------------------------------------
    # Convert OSRM coordinates
    #
    # OSRM:
    # [longitude, latitude]
    #
    # Leaflet:
    # [latitude, longitude]
    # -----------------------------------------------------

    route_coordinates = [

        [
            float(coordinate[1]),
            float(coordinate[0]),
        ]

        for coordinate
        in geometry["coordinates"]
    ]

    # -----------------------------------------------------
    # Road distance
    # -----------------------------------------------------

    road_distance_km = (
        float(
            road_route["distance"]
        )
        / 1000
    )

    # -----------------------------------------------------
    # Road duration
    # -----------------------------------------------------

    duration_minutes = (
        float(
            road_route["duration"]
        )
        / 60
    )

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {

        "id":
            route.id,

        "trip_id":
            route.trip_id,

        "source_latitude":
            source_lat,

        "source_longitude":
            source_lon,

        "destination_latitude":
            destination_lat,

        "destination_longitude":
            destination_lon,

        "pickup_latitude":
            source_lat,

        "pickup_longitude":
            source_lon,

        "pickup_location":
            trip.pickup_location,

        "destination":
            trip.destination,

        "distance":
            round(
                road_distance_km,
                2,
            ),

        "duration_minutes":
            round(
                duration_minutes,
                2,
            ),

        "route_coordinates":
            route_coordinates,

        "created_at":
            route.created_at,
    }