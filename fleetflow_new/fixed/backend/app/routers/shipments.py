from app import models
from app.routers.crud import build_crud_router
from app.schemas.shipments import ShipmentCreate, ShipmentRead, ShipmentUpdate

router = build_crud_router(
    model=models.Shipment,
    create_schema=ShipmentCreate,
    update_schema=ShipmentUpdate,
    read_schema=ShipmentRead,
)
