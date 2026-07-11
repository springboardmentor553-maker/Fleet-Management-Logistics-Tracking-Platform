from app.schemas.common import ORMModel


class DriverBase(ORMModel):
    name: str
    license_number: str
    phone: str | None = None
    status: str = "available"


class DriverCreate(DriverBase):
    pass


class DriverUpdate(ORMModel):
    name: str | None = None
    license_number: str | None = None
    phone: str | None = None
    status: str | None = None


class DriverRead(DriverBase):
    id: int
