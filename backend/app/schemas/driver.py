from pydantic import BaseModel


class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: str
    email: str
    status: str = "Available"


class DriverUpdate(BaseModel):
    name: str | None = None
    license_number: str | None = None
    phone: str | None = None
    email: str | None = None
    status: str | None = None


class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    phone: str
    email: str
    status: str

    class Config:
        from_attributes = True