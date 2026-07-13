from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.driver import Driver
from backend.app.schemas.driver import DriverCreate
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.post("/")
def add_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return {
        "message": "Driver Added Successfully",
        "driver": new_driver
    }
@router.get("/")
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    drivers = db.query(Driver).all()
    return drivers