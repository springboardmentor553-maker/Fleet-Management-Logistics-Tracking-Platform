from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Driver, RoleEnum, User
from app.schemas.driver import DriverCreate, DriverRead, DriverUpdate
from app.services.security import get_current_user, require_roles


router = APIRouter()


def _get_driver_or_404(db: Session, driver_id: int) -> Driver:
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


@router.post(
    "",
    response_model=DriverRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a driver profile for an existing user",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)) -> DriverRead:
    # Make sure the referenced user actually exists
    user = db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={payload.user_id} not found",
        )

    # Prevent duplicate driver profiles for the same user
    existing = db.query(Driver).filter(Driver.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A driver profile already exists for this user",
        )

    driver = Driver(user_id=payload.user_id, license_details=payload.license_details)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return DriverRead.model_validate(driver)


@router.get(
    "",
    response_model=list[DriverRead],
    summary="List all driver profiles",
)
def list_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DriverRead]:
    drivers = db.query(Driver).order_by(Driver.id.asc()).all()
    return [DriverRead.model_validate(d) for d in drivers]


@router.get(
    "/{driver_id}",
    response_model=DriverRead,
    summary="Get a single driver profile",
)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DriverRead:
    driver = _get_driver_or_404(db, driver_id)
    return DriverRead.model_validate(driver)


@router.patch(
    "/{driver_id}",
    response_model=DriverRead,
    summary="Update a driver's license details",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
) -> DriverRead:
    driver = _get_driver_or_404(db, driver_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return DriverRead.model_validate(driver)


@router.delete(
    "/{driver_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a driver profile",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN))],
)
def delete_driver(driver_id: int, db: Session = Depends(get_db)) -> None:
    driver = _get_driver_or_404(db, driver_id)
    db.delete(driver)
    db.commit()
