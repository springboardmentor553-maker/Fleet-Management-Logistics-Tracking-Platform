from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import DriverStatus, ShipmentStatus, VehicleStatus
from app.db.session import get_db
from app.modules.drivers.models import Driver
from app.modules.fleet.models import Vehicle
from app.modules.shipments.models import Shipment

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class FleetSnapshot(BaseModel):
    total_vehicles: int
    active_vehicles: int
    in_shop_vehicles: int


class DriverSnapshot(BaseModel):
    total_drivers: int
    available_drivers: int
    on_trip_drivers: int


class ShipmentSnapshot(BaseModel):
    total_shipments: int
    pending: int
    in_transit: int
    delivered: int
    cancelled: int


class DashboardSummary(BaseModel):
    fleet: FleetSnapshot
    drivers: DriverSnapshot
    shipments: ShipmentSnapshot
    open_maintenance_jobs: int


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total_vehicles = db.scalar(select(func.count()).select_from(Vehicle)) or 0
    active_vehicles = db.scalar(select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.ACTIVE)) or 0
    in_shop_vehicles = db.scalar(select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.IN_SHOP)) or 0

    total_drivers = db.scalar(select(func.count()).select_from(Driver)) or 0
    available_drivers = db.scalar(select(func.count()).select_from(Driver).where(Driver.status == DriverStatus.AVAILABLE)) or 0
    on_trip_drivers = db.scalar(select(func.count()).select_from(Driver).where(Driver.status == DriverStatus.ON_TRIP)) or 0

    total_shipments = db.scalar(select(func.count()).select_from(Shipment)) or 0
    pending = db.scalar(select(func.count()).select_from(Shipment).where(Shipment.status == ShipmentStatus.PENDING)) or 0
    in_transit = db.scalar(select(func.count()).select_from(Shipment).where(Shipment.status == ShipmentStatus.IN_TRANSIT)) or 0
    delivered = db.scalar(select(func.count()).select_from(Shipment).where(Shipment.status == ShipmentStatus.DELIVERED)) or 0
    cancelled = db.scalar(select(func.count()).select_from(Shipment).where(Shipment.status == ShipmentStatus.CANCELLED)) or 0

    open_maintenance_jobs = db.scalar(select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.IN_SHOP)) or 0

    return DashboardSummary(
        fleet=FleetSnapshot(
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            in_shop_vehicles=in_shop_vehicles,
        ),
        drivers=DriverSnapshot(
            total_drivers=total_drivers,
            available_drivers=available_drivers,
            on_trip_drivers=on_trip_drivers,
        ),
        shipments=ShipmentSnapshot(
            total_shipments=total_shipments,
            pending=pending,
            in_transit=in_transit,
            delivered=delivered,
            cancelled=cancelled,
        ),
        open_maintenance_jobs=open_maintenance_jobs,
    )
