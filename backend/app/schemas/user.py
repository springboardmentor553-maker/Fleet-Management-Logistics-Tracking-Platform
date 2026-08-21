from pydantic import BaseModel, EmailStr


# =========================================================
# REGISTER SCHEMA
# =========================================================

class UserCreate(BaseModel):

    username: str

    email: EmailStr

    password: str

    role: str = "driver"


# =========================================================
# LOGIN SCHEMA
# =========================================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str