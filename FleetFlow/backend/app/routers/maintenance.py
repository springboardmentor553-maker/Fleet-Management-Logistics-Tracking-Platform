from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse
)

from app.services import maintenance as maintenance_service

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


@router.post(
    "/",
    response_model=MaintenanceResponse
)
def create_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        return maintenance_service.create_maintenance(
            db,
            maintenance
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[MaintenanceResponse]
)
def get_maintenance_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return maintenance_service.get_all_maintenance(db)


@router.get(
    "/{maintenance_id}",
    response_model=MaintenanceResponse
)
def get_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    maintenance = (
        maintenance_service.get_maintenance_by_id(
            db,
            maintenance_id
        )
    )

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return maintenance


@router.put(
    "/{maintenance_id}",
    response_model=MaintenanceResponse
)
def update_maintenance(
    maintenance_id: int,
    maintenance: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        updated = maintenance_service.update_maintenance(
            db,
            maintenance_id,
            maintenance
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Maintenance record not found"
            )

        return updated

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

