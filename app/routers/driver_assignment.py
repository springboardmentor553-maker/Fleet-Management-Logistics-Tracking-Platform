from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.driver_assignment import DriverAssignmentCreate, DriverAssignmentUpdate, DriverAssignmentResponse
from app.services.driver_assignment_service import (
    assign_driver,
    get_all_assignments,
    get_assignment,
    update_assignment,
    remove_assignment,
)

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignment"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=DriverAssignmentResponse)
def add_assignment(assignment: DriverAssignmentCreate, db: Session = Depends(get_db)):
    return assign_driver(assignment, db)


@router.get("/", response_model=list[DriverAssignmentResponse])
def fetch_assignments(db: Session = Depends(get_db)):
    return get_all_assignments(db)


@router.get("/{assignment_id}", response_model=DriverAssignmentResponse)
def fetch_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return get_assignment(assignment_id, db)


@router.put("/{assignment_id}", response_model=DriverAssignmentResponse)
def edit_assignment(assignment_id: int, assignment: DriverAssignmentUpdate, db: Session = Depends(get_db)):
    return update_assignment(assignment_id, assignment, db)


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return remove_assignment(assignment_id, db)