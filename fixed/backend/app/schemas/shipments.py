from app.schemas.common import ORMModel


class ShipmentBase(ORMModel):
    tracking_number: str | None = None
    customer_name: str
    source: str
    destination: str
    cargo_description: str | None = None
    weight: float | None = None
    status: str = "Created"

    vehicle_id: int | None = None
    driver_id: int | None = None
    route_id: int | None = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ORMModel):
    tracking_number: str | None = None
    customer_name: str | None = None
    source: str | None = None
    destination: str | None = None
    cargo_description: str | None = None
    weight: float | None = None
    status: str | None = None
    vehicle_id: int | None = None
    driver_id: int | None = None
    route_id: int | None = None


class ShipmentRead(ShipmentBase):
    id: int


class ShipmentPublicStatusRead(ORMModel):
    tracking_number: str
    status: str
    driver_name: str | None = None
    vehicle_registration_number: str | None = None
    pickup_location: str | None = None
    destination: str | None = None
    eta: str | None = None

