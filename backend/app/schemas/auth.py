from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.DISPATCHER


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str | None = None
    email: str


class ProfileResponse(BaseModel):
    message: str
    user: dict