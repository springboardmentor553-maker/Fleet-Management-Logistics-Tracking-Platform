from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordUpdate,
    FuelRecordResponse
)

from app.services import fuel_record as fuel_service

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Records"]
)


@router.post(
    "/",
    response_model=FuelRecordResponse
)
def create_fuel_record(
    fuel_record: FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        return fuel_service.create_fuel_record(
            db,
            fuel_record
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[FuelRecordResponse]
)
def get_fuel_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return fuel_service.get_all_fuel_records(db)


@router.get(
    "/{fuel_record_id}",
    response_model=FuelRecordResponse
)
def get_fuel_record(
    fuel_record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    fuel_record = fuel_service.get_fuel_record_by_id(
        db,
        fuel_record_id
    )

    if not fuel_record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return fuel_record


@router.put(
    "/{fuel_record_id}",
    response_model=FuelRecordResponse
)
def update_fuel_record(
    fuel_record_id: int,
    fuel_record: FuelRecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        updated = fuel_service.update_fuel_record(
            db,
            fuel_record_id,
            fuel_record
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Fuel record not found"
            )

        return updated

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete("/{fuel_record_id}")
def delete_fuel_record(
    fuel_record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted = fuel_service.delete_fuel_record(
        db,
        fuel_record_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return {
        "message": "Fuel record deleted successfully"
    }