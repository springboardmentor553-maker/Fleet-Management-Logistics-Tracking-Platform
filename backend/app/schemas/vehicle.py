from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    capacity: int
    status: str

    class Config:
        from_attributes = True