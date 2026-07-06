from app import models
from app.routers.crud import build_crud_router
from app.schemas.routes import RouteCreate, RouteRead, RouteUpdate

router = build_crud_router(
    model=models.Route,
    create_schema=RouteCreate,
    update_schema=RouteUpdate,
    read_schema=RouteRead,
)
