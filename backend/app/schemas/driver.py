from pydantic import BaseModel


class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: str
    status: str


class DriverUpdate(BaseModel):
    name: str
    license_number: str
    phone: str
    status: str


class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: str
    status: str

    class Config:
        from_attributes = True
        