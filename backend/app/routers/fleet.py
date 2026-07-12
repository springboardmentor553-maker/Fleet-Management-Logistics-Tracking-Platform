from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip

router = APIRouter(
    prefix="/fleet",
    tags=["Fleet Monitoring"]
)


@router.get("/status")
def fleet_status(db: Session = Depends(get_db)):

    vehicles = db.query(Vehicle).all()

    data = []

    for vehicle in vehicles:

        active_trip = db.query(Trip).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == "In Transit"
        ).first()

        data.append({
            "vehicle_number": vehicle.vehicle_number,
            "status": vehicle.status,
            "current_trip": active_trip.id if active_trip else None
        })

    return {
        "fleet": data
    }