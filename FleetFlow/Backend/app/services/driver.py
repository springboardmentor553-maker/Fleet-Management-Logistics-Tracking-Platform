from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate


from datetime import datetime
from sqlalchemy import func
from app.models.user import User


def sync_driver_users(db: Session):
    """
    Ensures any user with role == 'driver' has a corresponding record in the drivers table.
    """
    driver_users = db.query(User).filter(func.lower(User.role) == "driver").all()
    created_any = False
    for u in driver_users:
        existing = db.query(Driver).filter(func.lower(Driver.email) == u.email.lower()).first()
        if not existing:
            email_prefix = u.email.split('@')[0].upper().replace('.', '').replace('-', '')[:8]
            lic_val = f"DL-{email_prefix}-{u.id}"
            if db.query(Driver).filter(Driver.license_number == lic_val).first():
                lic_val = f"DL-{u.id}-{int(datetime.utcnow().timestamp())}"
            d = Driver(
                name=u.name,
                email=u.email,
                phone=f"+9198765{10000 + u.id}",
                license_number=lic_val,
                is_available=True,
                attendance_status="present",
                safety_score=95,
                completed_trips_count=0,
                total_distance_km=0.0,
                rating=4.8,
            )
            db.add(d)
            created_any = True
    if created_any:
        try:
            db.commit()
        except Exception:
            db.rollback()


def get_all_drivers(db: Session) -> list[Driver]:
    sync_driver_users(db)
    return db.query(Driver).order_by(Driver.id).all()


def get_driver_by_id(driver_id: int, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


def create_driver(data: DriverCreate, db: Session) -> Driver:
    if db.query(Driver).filter(Driver.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if db.query(Driver).filter(Driver.license_number == data.license_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already registered")
    driver = Driver(**data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(driver_id: int, data: DriverUpdate, db: Session) -> Driver:
    driver = get_driver_by_id(driver_id, db)
    changes = data.model_dump(exclude_unset=True)
    if "email" in changes:
        conflict = db.query(Driver).filter(Driver.email == changes["email"], Driver.id != driver_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
    if "license_number" in changes:
        conflict = db.query(Driver).filter(Driver.license_number == changes["license_number"], Driver.id != driver_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already in use")
    for field, value in changes.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


def delete_driver(driver_id: int, db: Session) -> None:
    driver = get_driver_by_id(driver_id, db)
    db.delete(driver)
    db.commit()
