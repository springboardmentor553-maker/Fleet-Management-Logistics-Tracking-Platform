from app import models
from app.routers.crud import build_crud_router
from app.schemas.drivers import DriverCreate, DriverRead, DriverUpdate

router = build_crud_router(
    model=models.Driver,
    create_schema=DriverCreate,
    update_schema=DriverUpdate,
    read_schema=DriverRead,
)
