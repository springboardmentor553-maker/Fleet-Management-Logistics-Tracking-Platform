from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from app.services.driver import get_all_drivers, get_driver_by_id, create_driver, update_driver, delete_driver

router = APIRouter(prefix="/drivers", tags=["Drivers"])

_mgmt = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/", response_model=list[DriverResponse])
def list_drivers(db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    return get_all_drivers(db)


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    return get_driver_by_id(driver_id, db)


@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def add_driver(data: DriverCreate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    return create_driver(data, db)


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver_route(driver_id: int, data: DriverUpdate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    return update_driver(driver_id, data, db)


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver_route(driver_id: int, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    delete_driver(driver_id, db)
