from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vehicle_number: str
    registration_number: str
    vehicle_type: str
    capacity: int
    fuel_type: str
    status: str = "Available"
    driver_id: int | None = None


class VehicleUpdate(BaseModel):
    vehicle_number: str
    registration_number: str
    vehicle_type: str
    capacity: int
    fuel_type: str
    status: str
    driver_id: int | None = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    registration_number: str
    vehicle_type: str
    capacity: int
    fuel_type: str
    status: str
    driver_id: int | None

    class Config:
        from_attributes = True