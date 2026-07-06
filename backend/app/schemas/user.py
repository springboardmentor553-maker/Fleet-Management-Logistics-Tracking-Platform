from pydantic import BaseModel, EmailStr


# Used for user registration
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


# Used for user login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Response after user registration
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


# JWT Token response
class Token(BaseModel):
    access_token: str
    token_type: str