from datetime import datetime

from app.schemas.common import ORMModel


class VehicleBase(ORMModel):
    make: str
    model: str
    year: int
    license_plate: str
    vin: str | None = None
    status: str = "active"
    capacity_weight: float | None = None
    capacity_volume: float | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(ORMModel):
    make: str | None = None
    model: str | None = None
    year: int | None = None
    license_plate: str | None = None
    vin: str | None = None
    status: str | None = None
    capacity_weight: float | None = None
    capacity_volume: float | None = None


class VehicleRead(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime