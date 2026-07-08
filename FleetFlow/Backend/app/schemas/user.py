from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Literal

VALID_ROLES = {"admin", "fleet_manager", "driver", "dispatcher"}


class UserRegister(BaseModel):
    name: str = Field(..., example="John Doe", description="Full name of the user")
    email: EmailStr = Field(..., example="john@fleetflow.com", description="Unique email address")
    password: str = Field(..., example="secret123", min_length=6, description="Password (min 6 chars)")
    role: str = Field("admin", example="admin", description="One of: admin, fleet_manager, driver, dispatcher")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {sorted(VALID_ROLES)}")
        return v


class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="admin@fleetflow.com")
    password: str = Field(..., example="admin123")


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
