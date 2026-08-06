from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.models.user import User

from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)

from app.schemas.common import MessageResponse

router = APIRouter()

# -----------------------------
# Add Maintenance Record
# Admin + Fleet Manager
# -----------------------------
@router.post("/", response_model=MaintenanceResponse)
def add_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

# -----------------------------
# Update Vehicle Status
# -----------------------------
    vehicle.status = "maintenance"

    new_record = Maintenance(
        vehicle_id=maintenance.vehicle_id,
        maintenance_category=maintenance.maintenance_category.value,
        service_date=maintenance.service_date,
        next_service_date=maintenance.next_service_date,
        service_cost=maintenance.service_cost,
        service_provider=maintenance.service_provider,
        maintenance_status=maintenance.maintenance_status.value,
        notes=maintenance.notes,
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record

# -----------------------------
# View All Maintenance Records
# Admin + Fleet Manager
# -----------------------------
@router.get("/", response_model=list[MaintenanceResponse])
def get_all_maintenance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    return db.query(Maintenance).all()

# -----------------------------
# View Single Maintenance Record
# Admin + Fleet Manager
# -----------------------------
@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found."
        )

    return maintenance

# -----------------------------
# Update Maintenance Record
# Admin + Fleet Manager
# -----------------------------
@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(
    maintenance_id: int,
    maintenance: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    db_maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if db_maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found."
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    update_data = maintenance.model_dump(exclude_unset=True)

    if "maintenance_category" in update_data:
        update_data["maintenance_category"] = (
            update_data["maintenance_category"].value
        )

    if "maintenance_status" in update_data:
        update_data["maintenance_status"] = (
            update_data["maintenance_status"].value
        )

    for key, value in update_data.items():
        setattr(db_maintenance, key, value)

    db.commit()
    db.refresh(db_maintenance)

    return db_maintenance

# -----------------------------
# Delete Maintenance Record
# Disabled to preserve history
# -----------------------------
@router.delete("/{maintenance_id}", response_model=MessageResponse)
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    raise HTTPException(
        status_code=403,
        detail="Maintenance history cannot be deleted."
    )

