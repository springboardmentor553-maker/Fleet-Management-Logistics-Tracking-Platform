from datetime import datetime

from app.schemas.common import ORMModel


class UserBase(ORMModel):
    email: str
    full_name: str | None = None
    role: str = "manager"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(ORMModel):
    email: str | None = None
    full_name: str | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime