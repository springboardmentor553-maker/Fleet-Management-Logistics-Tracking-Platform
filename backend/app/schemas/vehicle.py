from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.enums import (
    MaintenanceCategory,
    MaintenanceStatus,
)


# -----------------------------
# Maintenance Summary
# -----------------------------
class MaintenanceSummary(BaseModel):
    id: int
    maintenance_category: MaintenanceCategory
    service_date: datetime
    next_service_date: datetime
    service_cost: float
    service_provider: str
    maintenance_status: MaintenanceStatus
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# -----------------------------
# Vehicle Create
# -----------------------------
class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str
    fuel_type: str
    model: str
    manufacturer: str


# -----------------------------
# Vehicle Update
# -----------------------------
class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    fuel_type: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None


# -----------------------------
# Vehicle Response
# -----------------------------
class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str
    fuel_type: str
    model: str
    manufacturer: str

    maintenance_records: list[MaintenanceSummary] = []

    class Config:
        from_attributes = True


# -----------------------------
# Dashboard Summary
# -----------------------------
class FleetSummary(BaseModel):
    totalVehicles: int
    available: int
    onTrip: int
    maintenance: int
    inactive: int