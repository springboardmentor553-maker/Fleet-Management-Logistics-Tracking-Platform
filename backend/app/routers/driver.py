from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.trip import Trip
from app.schemas.driver import DriverCreate, DriverUpdate

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


# =====================================================
# CREATE DRIVER
# =====================================================

@router.post("/")
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Check duplicate email
    existing_email = db.query(Driver).filter(
        Driver.email == driver.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Check duplicate license number
    existing_license = db.query(Driver).filter(
        Driver.license_number == driver.license_number
    ).first()

    if existing_license:
        raise HTTPException(
            status_code=400,
            detail="License number already exists"
        )

    # Create driver
    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone,
        email=driver.email,
        status=driver.status
    )

    db.add(new_driver)

    # Generate ID before creating audit log
    db.flush()

    # Create audit log
    create_audit_log(
        db=db,
        user=current_user,
        module="Driver",
        action="CREATE",
        details=(
            f"Driver {new_driver.name} "
            f"(ID: {new_driver.id}) was created."
        )
    )

    db.commit()
    db.refresh(new_driver)

    return new_driver


# =====================================================
# GET ALL DRIVERS
# =====================================================

@router.get("/")
def get_all_drivers(
    db: Session = Depends(get_db)
):

    return db.query(Driver).all()


# =====================================================
# GET DRIVER BY ID
# =====================================================

@router.get("/{driver_id}")
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver


# =====================================================
# UPDATE DRIVER
# =====================================================

@router.put("/{driver_id}")
def update_driver(
    driver_id: int,
    updated: DriverUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Store old values for audit log
    old_name = driver.name
    old_license = driver.license_number
    old_phone = driver.phone
    old_email = driver.email
    old_status = driver.status

    # Update only provided fields
    values = updated.model_dump(exclude_unset=True)

    for key, value in values.items():
        setattr(driver, key, value)

    # Create audit log
    create_audit_log(
        db=db,
        user=current_user,
        module="Driver",
        action="UPDATE",
        details=(
            f"Driver ID {driver.id} updated. "
            f"Name: {old_name} -> {driver.name}. "
            f"License: {old_license} -> {driver.license_number}. "
            f"Phone: {old_phone} -> {driver.phone}. "
            f"Email: {old_email} -> {driver.email}. "
            f"Status: {old_status} -> {driver.status}."
        )
    )

    db.commit()
    db.refresh(driver)

    return driver


# =====================================================
# DELETE DRIVER
# =====================================================

@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Store values before deleting
    driver_name = driver.name
    driver_id_value = driver.id

    # Create audit log BEFORE deleting driver
    create_audit_log(
        db=db,
        user=current_user,
        module="Driver",
        action="DELETE",
        details=(
            f"Driver {driver_name} "
            f"(ID: {driver_id_value}) was deleted."
        )
    )

    db.delete(driver)

    db.commit()

    return {
        "message": "Driver deleted successfully"
    }


# =====================================================
# DRIVER PERFORMANCE
# =====================================================

@router.get("/{driver_id}/performance")
def driver_performance(
    driver_id: int,
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    total_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id
    ).count()

    scheduled_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status == "Scheduled"
    ).count()

    active_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status == "In Transit"
    ).count()

    completed_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status.in_(["Delivered", "Completed"])
    ).count()

    cancelled_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status == "Cancelled"
    ).count()

    return {
        "driver": driver,
        "performance": {
            "total_trips": total_trips,
            "scheduled_trips": scheduled_trips,
            "active_trips": active_trips,
            "completed_trips": completed_trips,
            "cancelled_trips": cancelled_trips
        }
    }