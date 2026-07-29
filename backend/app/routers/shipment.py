from backend.app.schemas.shipment_history import ShipmentHistoryResponse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.shipment import Shipment
from backend.app.models.driver import Driver
from backend.app.models.vehicle import Vehicle
from backend.app.models.shipment_history import ShipmentHistory
from backend.app.schemas.shipment import ShipmentCreate, ShipmentUpdate, ShipmentStatusUpdate
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)


# -------------------- ADD SHIPMENT --------------------

@router.post("/")
def add_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    # Check Driver
    driver = db.query(Driver).filter(
        Driver.id == shipment.driver_id
    ).first()

    if not driver:
        return {"message": "Driver Not Found"}

    if driver.status != "Available":
        return {"message": "Driver Not Available"}

    # Check Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == shipment.vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle Not Found"}

    if vehicle.status != "Available":
        return {"message": "Vehicle Not Available"}

    # Create Shipment
    new_shipment = Shipment(
        source=shipment.source,
        destination=shipment.destination,
        driver_id=shipment.driver_id,
        vehicle_id=shipment.vehicle_id,
        status="Created"
    )

    # Update statuses
    driver.status = "On Trip"
    vehicle.status = "On Trip"

    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)

    # Save shipment history
    history = ShipmentHistory(
        shipment_id=new_shipment.id,
        status="Created"
    )

    db.add(history)
    db.commit()

    return {
        "message": "Shipment Added Successfully",
        "shipment": new_shipment
    }


# -------------------- GET ALL --------------------

@router.get("/")
def get_all_shipments(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    return db.query(Shipment).all()


# -------------------- GET ONE --------------------

@router.get("/{shipment_id}")
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment Not Found"}

    return shipment


# -------------------- UPDATE --------------------

@router.put("/{shipment_id}")
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    db_shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not db_shipment:
        return {"message": "Shipment Not Found"}

    db_shipment.source = shipment.source
    db_shipment.destination = shipment.destination
    db_shipment.status = shipment.status
    db_shipment.driver_id = shipment.driver_id
    db_shipment.vehicle_id = shipment.vehicle_id

    db.commit()
    db.refresh(db_shipment)

    # Save history
    history = ShipmentHistory(
        shipment_id=db_shipment.id,
        status=db_shipment.status
    )

    db.add(history)
    db.commit()

    return {
        "message": "Shipment Updated Successfully",
        "shipment": db_shipment
    }


# -------------------- UPDATE STATUS --------------------

@router.put("/{shipment_id}/status")
def update_shipment_status(
    shipment_id: int,
    status_update: ShipmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment Not Found")

    allowed_statuses = {"Created", "Assigned", "In Transit", "Delayed", "Delivered", "Cancelled"}
    target_status = status_update.status

    if target_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: '{target_status}'. Must be one of {allowed_statuses}"
        )

    current_status = db_shipment.status

    # Prevent duplicate history logs if status hasn't changed
    if current_status == target_status:
        return {
            "message": "Shipment status is already set to the requested status",
            "shipment": db_shipment
        }

    # Define sensible transitions
    valid_transitions = {
        "Created": {"Assigned", "Cancelled"},
        "Assigned": {"In Transit", "Cancelled"},
        "In Transit": {"Delayed", "Delivered", "Cancelled"},
        "Delayed": {"In Transit", "Delivered", "Cancelled"},
        "Delivered": set(),
        "Cancelled": set()
    }

    allowed_targets = valid_transitions.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{current_status}' to '{target_status}'"
        )

    # Apply status change
    db_shipment.status = target_status

    # If completed/cancelled, release driver and vehicle availability
    if target_status in ("Delivered", "Cancelled"):
        if db_shipment.driver_id:
            driver = db.query(Driver).filter(Driver.id == db_shipment.driver_id).first()
            if driver:
                driver.status = "Available"
        if db_shipment.vehicle_id:
            vehicle = db.query(Vehicle).filter(Vehicle.id == db_shipment.vehicle_id).first()
            if vehicle:
                vehicle.status = "Available"

    db.commit()
    db.refresh(db_shipment)

    # Log into ShipmentHistory
    history = ShipmentHistory(
        shipment_id=db_shipment.id,
        status=target_status
    )
    db.add(history)
    db.commit()

    return {
        "message": "Shipment Status Updated Successfully",
        "shipment": db_shipment
    }


# -------------------- COMPLETE SHIPMENT --------------------

@router.put("/{shipment_id}/complete")
def complete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment Not Found"}

    shipment.status = "Completed"

    driver = db.query(Driver).filter(
        Driver.id == shipment.driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == shipment.vehicle_id
    ).first()

    if driver:
        driver.status = "Available"

    if vehicle:
        vehicle.status = "Available"

    # Save completion history
    history = ShipmentHistory(
        shipment_id=shipment.id,
        status="Completed"
    )

    db.add(history)

    db.commit()
    db.refresh(shipment)

    return {
        "message": "Shipment Completed Successfully",
        "shipment": shipment
    }
@router.get("/{shipment_id}/history")
def get_shipment_history(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        role_required(["Admin", "Fleet Manager", "Dispatcher"])
    )
):

    history = db.query(ShipmentHistory).filter(
        ShipmentHistory.shipment_id == shipment_id
    ).all()

    if not history:
        return {"message": "No History Found"}

    return history


# -------------------- DELETE --------------------

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin"]))
):

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment Not Found"}

    db.delete(shipment)
    db.commit()

    return {
        "message": "Shipment Deleted Successfully"
    }