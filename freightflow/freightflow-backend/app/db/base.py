from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def str_enum(enum_cls: type[PyEnum]) -> SAEnum:
    """SQLAlchemy Enum column that persists the member's .value (e.g. 'active')
    instead of its .name (e.g. 'ACTIVE'), matching what the API/Pydantic layer uses."""
    return SAEnum(enum_cls, values_callable=lambda cls: [member.value for member in cls])


class Base(DeclarativeBase):
    """Shared declarative base for every ORM model in the platform."""

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
