from sqlalchemy import Column, Integer, String, Boolean

from app.database import Base


class Settings(Base):

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    company_name = Column(String(200), nullable=False)

    admin_email = Column(String(200), nullable=False)

    phone = Column(String(20), nullable=False)

    language = Column(String(50), default="English")

    dark_mode = Column(Boolean, default=False)