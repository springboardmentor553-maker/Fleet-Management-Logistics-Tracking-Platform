from app.schemas.common import ORMModel


class VehicleBase(ORMModel):
    vehicle_number: str
    vehicle_type: str
    capacity: float | None = None
    status: str = "available"
    current_location: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(ORMModel):
    vehicle_number: str | None = None
    vehicle_type: str | None = None
    capacity: float | None = None
    status: str | None = None
    current_location: str | None = None


class VehicleRead(VehicleBase):
    id: int
