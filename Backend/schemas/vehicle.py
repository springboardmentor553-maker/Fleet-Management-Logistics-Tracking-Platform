from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    model: str
    capacity: int
    status: str
class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        from_attributes = True


class VehicleUpdate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    model: str
    capacity: int
    status: str