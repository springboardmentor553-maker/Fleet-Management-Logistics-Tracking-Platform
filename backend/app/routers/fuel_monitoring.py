from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.vehicle import Vehicle
from app.models.trip import Trip

from app.schemas.fuel_monitoring import (
    FuelRecordCreate,
    FuelRecordUpdate,
    FuelRecordResponse,
    FuelSummaryResponse,
    VehicleFuelPerformance,
    FuelAlert,
    FuelMonitoringResponse,
)

from app.services.fuel_service import (
    create_fuel_record,
    get_fuel_records,
    get_fuel_record,
    update_fuel_record,
    delete_fuel_record,
    get_fuel_summary,
    get_vehicle_performance,
    get_fuel_alerts,
    get_fuel_monitoring_data,
)


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/fuel-monitoring",
    tags=["Fuel Monitoring"],
)


# ==========================================================
# COMPLETE MONITORING
# ==========================================================

@router.get(
    "/",
    response_model=FuelMonitoringResponse,
)
def get_fuel_monitoring(
    db: Session = Depends(get_db),
):

    return get_fuel_monitoring_data(
        db
    )


# ==========================================================
# SUMMARY
# ==========================================================

@router.get(
    "/summary",
    response_model=FuelSummaryResponse,
)
def fuel_summary(
    db: Session = Depends(get_db),
):

    return get_fuel_summary(
        db
    )


# ==========================================================
# VEHICLES
# ==========================================================

@router.get(
    "/vehicles",
    response_model=list[
        VehicleFuelPerformance
    ],
)
def vehicle_fuel_performance(
    db: Session = Depends(get_db),
):

    return get_vehicle_performance(
        db
    )


# ==========================================================
# ALERTS
# ==========================================================

@router.get(
    "/alerts",
    response_model=list[FuelAlert],
)
def fuel_alerts(
    db: Session = Depends(get_db),
):

    return get_fuel_alerts(
        db
    )


# ==========================================================
# RECORDS
# ==========================================================

@router.get(
    "/records",
    response_model=list[
        FuelRecordResponse
    ],
)
def all_fuel_records(
    db: Session = Depends(get_db),
):

    return get_fuel_records(
        db
    )


# ==========================================================
# ONE RECORD
# ==========================================================

@router.get(
    "/records/{record_id}",
    response_model=FuelRecordResponse,
)
def one_fuel_record(
    record_id: int,
    db: Session = Depends(get_db),
):

    record = get_fuel_record(
        db,
        record_id,
    )

    if record is None:

        raise HTTPException(
            status_code=404,
            detail="Fuel record not found",
        )

    return record


# ==========================================================
# CREATE RECORD
# ==========================================================

@router.post(
    "/records",
    response_model=FuelRecordResponse,
    status_code=201,
)
def add_fuel_record(
    fuel_data: FuelRecordCreate,
    db: Session = Depends(get_db),
):

    # ======================================================
    # CHECK VEHICLE
    # ======================================================

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id
            == fuel_data.vehicle_id
        )
        .first()
    )


    if vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )


    # ======================================================
    # CHECK TRIP
    # ======================================================

    if fuel_data.trip_id is not None:

        trip = (
            db.query(Trip)
            .filter(
                Trip.id
                == fuel_data.trip_id
            )
            .first()
        )


        if trip is None:

            raise HTTPException(
                status_code=404,
                detail="Trip not found",
            )


        # ==================================================
        # VEHICLE/TRIP VALIDATION
        # ==================================================

        if (
            trip.vehicle_id
            != fuel_data.vehicle_id
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip is not assigned "
                    "to this vehicle"
                ),
            )


    try:

        return create_fuel_record(
            db,
            fuel_data,
        )


    except Exception as error:

        db.rollback()

        print(
            "CREATE FUEL RECORD ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create fuel record",
        )


# ==========================================================
# UPDATE RECORD
# ==========================================================

@router.put(
    "/records/{record_id}",
    response_model=FuelRecordResponse,
)
def edit_fuel_record(
    record_id: int,
    fuel_data: FuelRecordUpdate,
    db: Session = Depends(get_db),
):

    record = get_fuel_record(
        db,
        record_id,
    )


    if record is None:

        raise HTTPException(
            status_code=404,
            detail="Fuel record not found",
        )


    vehicle_id = (

        fuel_data.vehicle_id

        if fuel_data.vehicle_id is not None

        else record.vehicle_id

    )


    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id
            == vehicle_id
        )
        .first()
    )


    if vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )


    trip_id = (

        fuel_data.trip_id

        if fuel_data.trip_id is not None

        else record.trip_id

    )


    if trip_id is not None:

        trip = (
            db.query(Trip)
            .filter(
                Trip.id
                == trip_id
            )
            .first()
        )


        if trip is None:

            raise HTTPException(
                status_code=404,
                detail="Trip not found",
            )


        if (
            trip.vehicle_id
            != vehicle_id
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip is not assigned "
                    "to this vehicle"
                ),
            )


    try:

        return update_fuel_record(
            db,
            record,
            fuel_data,
        )


    except Exception as error:

        db.rollback()

        print(
            "UPDATE FUEL RECORD ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update fuel record",
        )


# ==========================================================
# DELETE RECORD
# ==========================================================

@router.delete(
    "/records/{record_id}",
)
def remove_fuel_record(
    record_id: int,
    db: Session = Depends(get_db),
):

    record = get_fuel_record(
        db,
        record_id,
    )


    if record is None:

        raise HTTPException(
            status_code=404,
            detail="Fuel record not found",
        )


    try:

        delete_fuel_record(
            db,
            record,
        )


        return {

            "message":
                "Fuel record deleted successfully",

            "record_id":
                record_id,

        }


    except Exception as error:

        db.rollback()

        print(
            "DELETE FUEL RECORD ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete fuel record",
        )