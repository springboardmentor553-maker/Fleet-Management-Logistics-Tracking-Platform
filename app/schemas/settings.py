from pydantic import BaseModel, EmailStr


class SettingsUpdate(BaseModel):

    company_name: str

    admin_email: EmailStr

    phone: str

    language: str

    dark_mode: bool


class SettingsResponse(BaseModel):

    id: int

    company_name: str

    admin_email: EmailStr

    phone: str

    language: str

    dark_mode: bool

    class Config:

        from_attributes = True