from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Shipment
eta_db={}

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.post("/")
def create_shipment(
    source: str,
    destination: str,
    shipment_type: str,
    weight: float,
    status: str,
    driver_id: int,
    vehicle_id: int
):
    db = SessionLocal()

    shipment = Shipment(
        source=source,
        destination=destination,
        shipment_type=shipment_type,
        weight=weight,
        status=status,
        driver_id=driver_id,
        vehicle_id=vehicle_id
    )

    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    db.close()

    return {
        "message": "Shipment created successfully",
        "shipment": shipment
    }


@router.get("/")
def get_shipments():
    db = SessionLocal()

    shipments = db.query(Shipment).all()

    db.close()

    return shipments


@router.put("/{shipment_id}")
def update_shipment(
    shipment_id: int,
    source: str,
    destination: str,
    shipment_type: str,
    weight: float,
    status: str,
    driver_id: int,
    vehicle_id: int
):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()

    if not shipment:
        db.close()
        return {"message": "Shipment not found"}

    shipment.source = source
    shipment.destination = destination
    shipment.shipment_type = shipment_type
    shipment.weight = weight
    shipment.status = status
    shipment.driver_id = driver_id
    shipment.vehicle_id = vehicle_id

    db.commit()
    db.refresh(shipment)
    db.close()

    return {
        "message": "Shipment updated successfully",
        "shipment": shipment
    }


@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()

    if not shipment:
        db.close()
        return {"message": "Shipment not found"}

    db.delete(shipment)
    db.commit()
    db.close()

    return {
        "message": "Shipment deleted successfully"
    }

@router.put("/{shipment_id}/eta")
def update_eta(shipment_id: int, eta: str):
    eta_db[shipment_id] = eta

    return {
        "message": "ETA updated successfully",
        "shipment_id": shipment_id,
        "eta": eta
    }

@router.get("/{shipment_id}/eta")
def get_eta(shipment_id: int):
    if shipment_id not in eta_db:
        return {"message": "Shipment not found"}

    return {
        "shipment_id": shipment_id,
        "eta": eta_db[shipment_id]
    }