from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.trip import Trip

from app.schemas.route import (
    GeocodeRequest,
    GeocodeResponse,
    RouteRequest,
    RouteResponse,
)

from app.services.geocoding_service import (
    get_coordinates,
)

from app.services.route_service import (
    get_route,
)


# ==========================================================
# MAP ROUTER
# ==========================================================

router = APIRouter(
    prefix="/map",
    tags=["Map"],
)


# ==========================================================
# GEOCODE LOCATION
# ==========================================================

@router.post(
    "/geocode",
    response_model=GeocodeResponse,
)
def geocode_location(
    request: GeocodeRequest,
):

    try:

        location = (
            request.location or ""
        ).strip()

        if not location:

            raise HTTPException(
                status_code=400,
                detail="Location cannot be empty.",
            )

        coordinates = get_coordinates(
            location
        )

        return coordinates

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================================
# GENERATE ROUTE FROM COORDINATES
# ==========================================================

@router.post(
    "/route",
    response_model=RouteResponse,
)
def generate_route(
    request: RouteRequest,
):

    try:

        route = get_route(

            request.pickup_latitude,

            request.pickup_longitude,

            request.destination_latitude,

            request.destination_longitude,

        )

        return route

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================================
# GET ROUTE FOR SELECTED TRIP
#
# IMPORTANT:
# If coordinates are missing, automatically geocode the
# stored pickup/destination and save them into the trip.
# ==========================================================

@router.get(
    "/trip/{trip_id}",
)
def get_trip_route(

    trip_id: int,

    db: Session = Depends(get_db),

):

    # ------------------------------------------------------
    # Find Trip
    # ------------------------------------------------------

    trip = (

        db.query(Trip)

        .filter(
            Trip.id == trip_id
        )

        .first()

    )


    if trip is None:

        raise HTTPException(

            status_code=404,

            detail="Trip not found.",

        )


    # ------------------------------------------------------
    # Validate locations
    # ------------------------------------------------------

    if not trip.pickup_location:

        raise HTTPException(

            status_code=400,

            detail="Trip pickup location is empty.",

        )


    if not trip.destination:

        raise HTTPException(

            status_code=400,

            detail="Trip destination is empty.",

        )


    # ------------------------------------------------------
    # CHECK COORDINATES
    # ------------------------------------------------------

    coordinates_missing = (

        trip.pickup_latitude is None

        or trip.pickup_longitude is None

        or trip.destination_latitude is None

        or trip.destination_longitude is None

    )


    # ======================================================
    # AUTOMATICALLY GEOCODE IF MISSING
    # ======================================================

    if coordinates_missing:

        try:

            # ------------------------------------------------
            # Geocode pickup
            # ------------------------------------------------

            pickup = get_coordinates(

                trip.pickup_location

            )


            # ------------------------------------------------
            # Geocode destination
            # ------------------------------------------------

            destination = get_coordinates(

                trip.destination

            )


            # ------------------------------------------------
            # Save coordinates into database
            # ------------------------------------------------

            trip.pickup_latitude = (
                pickup["latitude"]
            )

            trip.pickup_longitude = (
                pickup["longitude"]
            )

            trip.destination_latitude = (
                destination["latitude"]
            )

            trip.destination_longitude = (
                destination["longitude"]
            )


            db.commit()

            db.refresh(trip)


        except Exception as e:

            db.rollback()

            raise HTTPException(

                status_code=400,

                detail=(

                    "Unable to locate the trip "
                    "pickup/destination using "
                    "OpenStreetMap: "

                    f"{str(e)}"

                ),

            )


    # ======================================================
    # GENERATE ROAD ROUTE USING OSRM
    # ======================================================

    try:

        route = get_route(

            trip.pickup_latitude,

            trip.pickup_longitude,

            trip.destination_latitude,

            trip.destination_longitude,

        )

    except Exception as e:

        raise HTTPException(

            status_code=400,

            detail=(

                "Unable to generate road route: "

                f"{str(e)}"

            ),

        )


    # ======================================================
    # RETURN COMPLETE TRIP ROUTE
    # ======================================================

    return {

        "trip_id":
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

        "trip_status":
            trip.trip_status,

        "distance_km":
            route["distance_km"],

        "duration_minutes":
            route["duration_minutes"],

        "geometry":
            route["geometry"],

    }