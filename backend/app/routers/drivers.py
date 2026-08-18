from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


router = APIRouter()


# =========================================================
# CONVERT DATABASE DRIVER → FRONTEND FORMAT
# =========================================================

def driver_to_response(driver):
    """
    Convert database Driver model to the format
    expected by the existing frontend.
    """

    status_value = (
        driver.status.value
        if hasattr(driver.status, "value")
        else driver.status
    )

    if status_value == "available":
        frontend_status = "Available"
    elif status_value == "on_trip":
        frontend_status = "Busy"
    else:
        frontend_status = "Busy"

    return {
        "id": driver.id,
        "name": driver.name,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "status": frontend_status,
    }


# =========================================================
# GET ALL DRIVERS
# =========================================================

@router.get("/", response_model=list[dict])
def get_drivers(
    db: Session = Depends(get_db),
):
    drivers = (
        db.query(models.Driver)
        .order_by(models.Driver.id)
        .all()
    )

    return [
        driver_to_response(driver)
        for driver in drivers
    ]


# =========================================================
# ADD DRIVER
# =========================================================

@router.post("/", response_model=dict)
def create_driver(
    data: dict,
    db: Session = Depends(get_db),
):
    name = data.get("name")
    phone = data.get("phone")
    license_number = data.get("license_number")
    status = data.get("status", "Available")

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Driver name is required",
        )

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is required",
        )

    if not license_number:
        raise HTTPException(
            status_code=400,
            detail="License number is required",
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE LICENSE
    # -----------------------------------------------------

    existing = (
        db.query(models.Driver)
        .filter(
            models.Driver.license_number
            == license_number
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="License number already exists",
        )

    # -----------------------------------------------------
    # FRONTEND STATUS → DATABASE STATUS
    # -----------------------------------------------------

    status_map = {
        "Available": "available",
        "Busy": "on_trip",
    }

    db_status = status_map.get(
        status,
        "available",
    )

    # -----------------------------------------------------
    # CREATE DRIVER
    # -----------------------------------------------------

    driver = models.Driver(
        name=name,
        license_number=license_number,
        phone=phone,
        phone_number=phone,
        status=db_status,
    )

    db.add(driver)

    try:
        db.commit()
        db.refresh(driver)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create driver",
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "id": driver.id,
        "name": driver.name,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "status": (
            "Available"
            if db_status == "available"
            else "Busy"
        ),
    }


# =========================================================
# UPDATE DRIVER
# =========================================================

@router.put("/{driver_id}", response_model=dict)
def update_driver(
    driver_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND DRIVER
    # -----------------------------------------------------

    driver = (
        db.query(models.Driver)
        .filter(
            models.Driver.id == driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # -----------------------------------------------------
    # UPDATE NAME
    # -----------------------------------------------------

    if "name" in data and data["name"]:
        driver.name = data["name"]

    # -----------------------------------------------------
    # UPDATE PHONE
    # -----------------------------------------------------

    if "phone" in data and data["phone"]:
        driver.phone = data["phone"]
        driver.phone_number = data["phone"]

    # -----------------------------------------------------
    # UPDATE LICENSE NUMBER
    # -----------------------------------------------------

    if (
        "license_number" in data
        and data["license_number"]
    ):
        new_license = data["license_number"]

        existing = (
            db.query(models.Driver)
            .filter(
                models.Driver.license_number
                == new_license,
                models.Driver.id
                != driver_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="License number already exists",
            )

        driver.license_number = new_license

    # -----------------------------------------------------
    # UPDATE STATUS
    # -----------------------------------------------------

    if "status" in data:
        status_map = {
            "Available": "available",
            "Busy": "on_trip",
        }

        driver.status = status_map.get(
            data["status"],
            "available",
        )

    # -----------------------------------------------------
    # SAVE CHANGES
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(driver)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update driver",
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    status_value = (
        driver.status.value
        if hasattr(driver.status, "value")
        else driver.status
    )

    return {
        "id": driver.id,
        "name": driver.name,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "status": (
            "Available"
            if status_value == "available"
            else "Busy"
        ),
    }


# =========================================================
# DELETE DRIVER
# =========================================================

@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND DRIVER
    # -----------------------------------------------------

    driver = (
        db.query(models.Driver)
        .filter(
            models.Driver.id == driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # -----------------------------------------------------
    # DELETE
    # -----------------------------------------------------

    try:
        db.delete(driver)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete driver",
        )

    return {
        "message": "Driver deleted successfully"
    }