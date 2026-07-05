from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime

VALID_ROLES = {"admin", "fleet_manager", "driver", "dispatcher"}


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "admin"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {sorted(VALID_ROLES)}")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
