from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.core import RoleEnum


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: RoleEnum = RoleEnum.DRIVER


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: RoleEnum


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair