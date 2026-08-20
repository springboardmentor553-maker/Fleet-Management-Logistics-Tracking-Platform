
from pydantic import BaseModel


class DriverCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    license_number: str
    experience: int
    status: str

class DriverResponse(DriverCreate):
    id: int

    class Config:
        from_attributes = True