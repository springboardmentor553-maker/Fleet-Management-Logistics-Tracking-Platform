from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import AccountRole, DriverStatus
from app.common.exceptions import ConflictError, NotFoundError
from app.modules.accounts.models import Account
from app.modules.drivers.models import Driver
from app.modules.drivers.schemas import DriverCreate, DriverUpdate


def get_driver_or_404(db: Session, driver_id: int) -> Driver:
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise NotFoundError(f"Driver {driver_id} was not found")
    return driver


def list_drivers(
    db: Session, offset: int, limit: int, status_filter: DriverStatus | None = None
) -> tuple[list[Driver], int]:
    query = select(Driver)
    if status_filter is not None:
        query = query.where(Driver.status == status_filter)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Driver.id).offset(offset).limit(limit)).all()
    return list(items), total


def create_driver(db: Session, payload: DriverCreate) -> Driver:
    account = db.get(Account, payload.account_id)
    if account is None:
        raise NotFoundError(f"Account {payload.account_id} was not found")
    if account.role != AccountRole.DRIVER:
        raise ConflictError("Linked account must have the driver role")

    duplicate_license = db.scalar(select(Driver).where(Driver.license_number == payload.license_number))
    if duplicate_license is not None:
        raise ConflictError("A driver with this license number already exists")

    already_linked = db.scalar(select(Driver).where(Driver.account_id == payload.account_id))
    if already_linked is not None:
        raise ConflictError("This account is already linked to a driver profile")

    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(db: Session, driver_id: int, payload: DriverUpdate) -> Driver:
    driver = get_driver_or_404(db, driver_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


def delete_driver(db: Session, driver_id: int) -> None:
    driver = get_driver_or_404(db, driver_id)
    db.delete(driver)
    db.commit()
