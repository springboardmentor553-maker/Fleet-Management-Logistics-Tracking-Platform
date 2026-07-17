from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.driver import (
    DriverCreate,
    DriverResponse,
)

from app.services.driver import (
    create_driver,
    get_driver,
    get_drivers,
    update_driver,
    delete_driver,
)

from app.auth.oauth2 import (
    get_current_user, 
    get_current_admin,
)

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.post("/", response_model=DriverResponse)
def create_new_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return create_driver(db, driver)


@router.get("/", response_model=list[DriverResponse])
def read_drivers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_drivers(db)


@router.get("/{driver_id}", response_model=DriverResponse)
def read_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    driver = get_driver(db, driver_id)

    if driver is None:

        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
def update_existing_driver(
    driver_id: int,
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    updated_driver = update_driver(
        db,
        driver_id,
        driver
    )

    if updated_driver is None:

        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return updated_driver


@router.delete("/{driver_id}")
def delete_existing_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted_driver = delete_driver(
        db,
        driver_id
    )

    if deleted_driver is None:

        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return {
        "message": "Driver deleted successfully"
    }