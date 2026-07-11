from app import models
from app.routers.crud import build_crud_router
from app.schemas.vehicles import VehicleCreate, VehicleRead, VehicleUpdate

router = build_crud_router(
    model=models.Vehicle,
    create_schema=VehicleCreate,
    update_schema=VehicleUpdate,
    read_schema=VehicleRead,
)
