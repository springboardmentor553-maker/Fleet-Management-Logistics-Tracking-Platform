from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trip import Trip
from app.services.routing_service import generate_route
from app.services.eta_service import calculate_eta
from app.models.route import Route, RouteStatus
from app.schemas.route import (
    RouteCreate,
    RouteUpdate,
    RouteResponse
)

router = APIRouter(
    prefix="/routes",
    tags=["Routes"]
)
router = APIRouter(
    prefix="/trip",
    tags=["Trip Route"]
)

# -------------------------
# Create Route
# -------------------------

@router.post("/", response_model=RouteResponse)
def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db)
):

    new_route = Route(
        route_name=route.route_name,
        source=route.source,
        destination=route.destination,
        distance=route.distance,
        estimated_time=route.estimated_time,
        driver_id=route.driver_id,
        vehicle_id=route.vehicle_id,
        status=RouteStatus.ACTIVE
    )

    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    return new_route


# -------------------------
# Get All Routes
# -------------------------

@router.get("/", response_model=list[RouteResponse])
def get_routes(
    db: Session = Depends(get_db)
):

    return db.query(Route).all()


# -------------------------
# Get Route By ID
# -------------------------

@router.get("/{route_id}", response_model=RouteResponse)
def get_route(
    route_id: int,
    db: Session = Depends(get_db)
):

    route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    return route


# -------------------------
# Update Route
# -------------------------

@router.put("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route: RouteUpdate,
    db: Session = Depends(get_db)
):

    db_route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if db_route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    db_route.route_name = route.route_name
    db_route.source = route.source
    db_route.destination = route.destination
    db_route.distance = route.distance
    db_route.estimated_time = route.estimated_time
    db_route.status = route.status
    db_route.driver_id = route.driver_id
    db_route.vehicle_id = route.vehicle_id

    db.commit()
    db.refresh(db_route)

    return db_route


# -------------------------
# Delete Route
# -------------------------

@router.delete("/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db)
):

    db_route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if db_route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    db.delete(db_route)
    db.commit()

    return {
        "message": "Route deleted successfully"
    }


# -------------------------
# Update Route Status
# -------------------------

@router.patch("/{route_id}/status")
def update_route_status(
    route_id: int,
    status: RouteStatus,
    db: Session = Depends(get_db)
):

    db_route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if db_route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    db_route.status = status

    db.commit()

    return {
        "message": "Route status updated successfully"
    }
@router.get("/{trip_id}/route")
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    route = generate_route(
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude
    )
    eta = calculate_eta(route["duration_seconds"])

    return {
        "trip_id": trip.id,
        "pickup_location": trip.pickup_location,
        "destination": trip.destination,
        "distance": f"{route['distance']} km",
        "estimated_travel_time": f"{route['estimated_travel_time']} minutes",
        "estimated_arrival": eta["estimated_arrival"],
        "current_time": eta["current_time"],
        "route_summary": route["route_summary"]
    }
@router.get("/{trip_id}/eta")
def get_trip_eta(
    trip_id: int,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    if (
        trip.pickup_latitude is None or
        trip.pickup_longitude is None or
        trip.destination_latitude is None or
        trip.destination_longitude is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Trip coordinates are missing"
        )

    route = generate_route(
        trip.pickup_latitude,
        trip.pickup_longitude,
        trip.destination_latitude,
        trip.destination_longitude
    )

    eta = calculate_eta(route["duration_seconds"])

    return {
        "trip_id": trip.id,
        "distance": f"{route['distance']} km",
        "estimated_travel_duration": f"{route['estimated_travel_time']} minutes",
        "estimated_arrival_time": eta["estimated_arrival"]
    }