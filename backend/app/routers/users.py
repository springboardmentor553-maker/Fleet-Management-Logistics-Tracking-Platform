from app import models
from app.routers.crud import build_crud_router
from app.schemas.users import UserCreate, UserRead, UserUpdate

router = build_crud_router(
    model=models.User,
    create_schema=UserCreate,
    update_schema=UserUpdate,
    read_schema=UserRead,
)
