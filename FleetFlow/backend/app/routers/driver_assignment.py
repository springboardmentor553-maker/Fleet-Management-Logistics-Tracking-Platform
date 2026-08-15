from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentUpdate,
    DriverAssignmentResponse
)

from app.services import driver_assignment as assignment_service

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignments"]
)


@router.post(
    "/",
    response_model=DriverAssignmentResponse
)
def create_driver_assignment(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        return assignment_service.create_assignment(
            db,
            assignment
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[DriverAssignmentResponse]
)
def get_driver_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return assignment_service.get_all_assignments(db)


@router.get(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse
)
def get_driver_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    assignment = assignment_service.get_assignment_by_id(
        db,
        assignment_id
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Driver assignment not found"
        )

    return assignment


@router.put(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse
)
def update_driver_assignment(
    assignment_id: int,
    assignment: DriverAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    updated = assignment_service.update_assignment(
        db,
        assignment_id,
        assignment
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Driver assignment not found"
        )

    return updated


@router.delete("/{assignment_id}")
def delete_driver_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted = assignment_service.delete_assignment(
        db,
        assignment_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Driver assignment not found"
        )

    return {
        "message": "Driver assignment removed successfully"
    }