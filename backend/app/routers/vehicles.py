from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
from app.websocket_manager import manager

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.post("/", response_model=schemas.VehicleResponse)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    existing = db.query(models.Vehicle).filter(
        models.Vehicle.registration_number == vehicle.registration_number
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle already registered")

    new_vehicle = models.Vehicle(**vehicle.dict())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


@router.get("/", response_model=list[schemas.VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()


@router.get("/{vehicle_id}", response_model=schemas.VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.put("/{vehicle_id}", response_model=schemas.VehicleResponse)
async def update_vehicle(vehicle_id: int, updated: schemas.VehicleCreate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    for key, value in updated.dict().items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)

    # Broadcast the updated location to all connected clients in real time
    if vehicle.current_lat is not None and vehicle.current_lng is not None:
        await manager.broadcast({
            "type": "vehicle_location_update",
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "current_lat": vehicle.current_lat,
            "current_lng": vehicle.current_lng,
            "status": vehicle.status,
        })

    return vehicle


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # FK-safe delete: check for linked shipments and trips before deleting,
    # so a linked record raises a clean 400 instead of crashing with a DB error.
    linked_shipment = db.query(models.Shipment).filter(models.Shipment.vehicle_id == vehicle_id).first()
    if linked_shipment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete vehicle — it is linked to shipment {linked_shipment.tracking_id}. Unassign or delete that shipment first."
        )

    linked_trip = db.query(models.Trip).filter(models.Trip.vehicle_id == vehicle_id).first()
    if linked_trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete vehicle — it is linked to trip #{linked_trip.id} ({linked_trip.origin} to {linked_trip.destination}). Delete or reassign that trip first."
        )

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully"}