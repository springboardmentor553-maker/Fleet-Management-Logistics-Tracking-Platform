from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    capacity: float


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    capacity: float

    class Config:
        from_attributes = True


class VehicleUpdate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    capacity: float
    status: str