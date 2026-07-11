from app.schemas.common import ORMModel


class UserBase(ORMModel):
    name: str
    email: str
    role: str = "manager"


class UserCreate(UserBase):
    password: str


class UserUpdate(ORMModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None


class UserRead(UserBase):
    id: int
