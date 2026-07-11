from app import models
from app.routers.crud import build_crud_router
from app.schemas.maintenance import MaintenanceCreate, MaintenanceRead, MaintenanceUpdate

router = build_crud_router(
    model=models.MaintenanceRecord,
    create_schema=MaintenanceCreate,
    update_schema=MaintenanceUpdate,
    read_schema=MaintenanceRead,
)
