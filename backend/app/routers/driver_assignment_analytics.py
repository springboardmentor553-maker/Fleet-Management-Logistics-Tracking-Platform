from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver_assignment import DriverAssignment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

router = APIRouter(
    prefix="/driver-assignment-analytics",
    tags=["Driver Assignment Analytics"]
)


# ==========================================================
# Dashboard Summary
# ==========================================================

@router.get("/dashboard")
def assignment_dashboard(db: Session = Depends(get_db)):

    total_assignments = db.query(DriverAssignment).count()

    active_assignments = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.status == "Assigned"
    ).count()

    released_assignments = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.status == "Released"
    ).count()

    available_drivers = db.query(
        Driver
    ).filter(
        Driver.status == "Available"
    ).count()

    assigned_drivers = db.query(
        Driver
    ).filter(
        Driver.status == "Assigned"
    ).count()

    available_vehicles = db.query(
        Vehicle
    ).filter(
        Vehicle.status == "Available"
    ).count()

    vehicles_in_transit = db.query(
        Vehicle
    ).filter(
        Vehicle.status == "In Transit"
    ).count()

    return {

        "total_assignments": total_assignments,

        "active_assignments": active_assignments,

        "released_assignments": released_assignments,

        "available_drivers": available_drivers,

        "assigned_drivers": assigned_drivers,

        "available_vehicles": available_vehicles,

        "vehicles_in_transit": vehicles_in_transit

    }


# ==========================================================
# Active Assignments
# ==========================================================

@router.get("/active")
def active_assignments(db: Session = Depends(get_db)):

    assignments = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.status == "Assigned"
    ).all()

    return assignments


# ==========================================================
# Released Assignments
# ==========================================================

@router.get("/released")
def released_assignments(db: Session = Depends(get_db)):

    assignments = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.status == "Released"
    ).all()

    return assignments


# ==========================================================
# Driver History
# ==========================================================

@router.get("/history/driver/{driver_id}")
def driver_history(
    driver_id: int,
    db: Session = Depends(get_db)
):

    history = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.driver_id == driver_id
    ).all()

    return history


# ==========================================================
# Vehicle History
# ==========================================================

@router.get("/history/vehicle/{vehicle_id}")
def vehicle_history(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    history = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.vehicle_id == vehicle_id
    ).all()

    return history


# ==========================================================
# Driver Utilization
# ==========================================================

@router.get("/driver-utilization")
def driver_utilization(
    db: Session = Depends(get_db)
):

    drivers = db.query(Driver).all()

    result = []

    for driver in drivers:

        total = db.query(
            DriverAssignment
        ).filter(
            DriverAssignment.driver_id == driver.id
        ).count()

        result.append({

            "driver_id": driver.id,

            "driver_name": driver.name,

            "total_assignments": total

        })

    return result


# ==========================================================
# Vehicle Utilization
# ==========================================================

@router.get("/vehicle-utilization")
def vehicle_utilization(
    db: Session = Depends(get_db)
):

    vehicles = db.query(Vehicle).all()

    result = []

    for vehicle in vehicles:

        total = db.query(
            DriverAssignment
        ).filter(
            DriverAssignment.vehicle_id == vehicle.id
        ).count()

        result.append({

            "vehicle_id": vehicle.id,

            "vehicle_number": vehicle.vehicle_number,

            "total_assignments": total

        })

    return result