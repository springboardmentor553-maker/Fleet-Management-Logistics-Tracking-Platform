from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate, MaintenanceResponse, MaintenanceUpdate

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)

@router.post("/", response_model=MaintenanceResponse)
def add_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db_maintenance = Maintenance(**maintenance.model_dump())

    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)

    return db_maintenance
@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance_records(db: Session = Depends(get_db)):
    maintenance_records = db.query(Maintenance).all()
    return maintenance_records
@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance_record(
    maintenance_id: int,
    db: Session = Depends(get_db)
):
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return maintenance
@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(
    maintenance_id: int,
    updated_maintenance: MaintenanceUpdate,
    db: Session = Depends(get_db)
):
    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == updated_maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    maintenance.vehicle_id = updated_maintenance.vehicle_id
    maintenance.service_date = updated_maintenance.service_date
    maintenance.maintenance_type = updated_maintenance.maintenance_type
    maintenance.cost = updated_maintenance.cost
    maintenance.status = updated_maintenance.status

    db.commit()
    db.refresh(maintenance)

    return maintenance
@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db)
):
    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    db.delete(maintenance)
    db.commit()

    return {
        "message": "Maintenance record deleted successfully"
    }