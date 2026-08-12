from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.eta_service import calculate_eta
from app.services.maps import get_route
from app.schemas.eta import ETAResponse

from app.database import get_db

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse
)

from app.services import trip as trip_service

from app.auth.oauth2 import (
    get_current_admin,
)


router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


@router.post("/", response_model=TripResponse)
def create_new_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    try:
        return trip_service.create_trip(db, trip)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/", response_model=list[TripResponse])
def get_trips(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return trip_service.get_all_trips(db)


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):

    trip = trip_service.get_trip_by_id(
        db,
        trip_id
    )

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return trip


@router.get("/{trip_id}/eta", response_model=ETAResponse)
def get_trip_eta(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):

    print("ETA trip_id:", trip_id)

    trip = trip_service.get_trip_by_id(db, trip_id)

    print("ETA trip:", trip)

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    route = get_route(
        trip.pickup_location,
        trip.delivery_location
    )

    eta = calculate_eta(
        route["duration_minutes"]
    )

    return {
        "trip_id": trip.id,
        "distance_km": route["distance_km"],
        "estimated_duration_minutes": route["duration_minutes"],
        "estimated_arrival_time": eta
    }


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):

    deleted = trip_service.delete_trip(
        db,
        trip_id
    )

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return {
        "message": "Trip deleted successfully"
    }