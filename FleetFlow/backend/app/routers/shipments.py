"""Shipment CRUD router – Milestone 2, Tasks 3 & 4.

Tracking numbers are auto-generated in the format FLT100001, FLT100002, …
The sequence is derived from the current maximum shipment id stored in the DB.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.core import RoleEnum, User, Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentRead, ShipmentUpdate
from app.services.security import get_current_user, require_roles


router = APIRouter()


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _get_shipment_or_404(db: Session, shipment_id: int) -> Shipment:
    """Fetch a shipment by primary key or raise HTTP 404."""
    shipment = db.get(Shipment, shipment_id)
    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment with id={shipment_id} not found",
        )
    return shipment


def _generate_tracking_number(db: Session) -> str:
    """Generate the next sequential tracking number in FLT1XXXXX format.

    The counter is derived from MAX(id) in the shipments table so that even
    after deletions the numbers never collide.
    """
    max_id: int | None = db.query(func.max(Shipment.id)).scalar()
    next_seq = (max_id or 0) + 1
    # Format: FLT + 1 + zero-padded 5-digit counter → FLT100001
    return f"FLT1{next_seq:05d}"


# ---------------------------------------------------------------------------
# CRUD Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ShipmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new shipment",
    description=(
        "Creates a new shipment record. "
        "The tracking number (FLT1XXXXX) is generated automatically."
    ),
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER))],
)
def create_shipment(
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
) -> ShipmentRead:
    tracking_number = _generate_tracking_number(db)

    shipment = Shipment(
        tracking_number=tracking_number,
        **payload.model_dump(),
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return ShipmentRead.model_validate(shipment)


@router.get(
    "",
    response_model=list[ShipmentRead],
    summary="List all shipments",
)
def list_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShipmentRead]:
    shipments = db.query(Shipment).order_by(Shipment.id.asc()).all()
    return [ShipmentRead.model_validate(s) for s in shipments]


@router.get(
    "/{shipment_id}",
    response_model=ShipmentRead,
    summary="Get a shipment by ID",
)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShipmentRead:
    shipment = _get_shipment_or_404(db, shipment_id)
    return ShipmentRead.model_validate(shipment)


@router.put(
    "/{shipment_id}",
    response_model=ShipmentRead,
    summary="Update a shipment",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER))],
)
def update_shipment(
    shipment_id: int,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
) -> ShipmentRead:
    shipment = _get_shipment_or_404(db, shipment_id)
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(shipment, field, value)

    db.commit()
    db.refresh(shipment)
    return ShipmentRead.model_validate(shipment)


@router.delete(
    "/{shipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shipment",
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
) -> None:
    shipment = _get_shipment_or_404(db, shipment_id)
    db.delete(shipment)
    db.commit()
