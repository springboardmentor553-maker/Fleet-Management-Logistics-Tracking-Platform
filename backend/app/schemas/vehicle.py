from pydantic import BaseModel
from typing import Optional


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str
    fuel_type: str
    model: str
    manufacturer: str


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    fuel_type: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str
    fuel_type: str
    model: str
    manufacturer: str

    class Config:
        from_attributes = True

class FleetSummary(BaseModel):
    totalVehicles: int
    available: int
    onTrip: int
    maintenance: int
    inactive: int