"""initial_schema

Revision ID: 9b3fca8810d9
Revises:
Create Date: 2026-07-22 08:15:23.628709
"""

from typing import Sequence, Union

from alembic import op
from app.database import Base
from app import models


revision: str = "9b3fca8810d9"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # These tables must exist before the maintenance migration.
    excluded_tables = {
        "maintenance",
        "maintenance_alerts",
        "driver_assignments",
    }

    tables = [
        table
        for table in Base.metadata.sorted_tables
        if table.name not in excluded_tables
    ]

    Base.metadata.create_all(
        bind=bind,
        tables=tables,
    )


def downgrade() -> None:
    bind = op.get_bind()

    excluded_tables = {
        "maintenance",
        "maintenance_alerts",
        "driver_assignments",
    }

    tables = [
        table
        for table in reversed(Base.metadata.sorted_tables)
        if table.name not in excluded_tables
    ]

    Base.metadata.drop_all(
        bind=bind,
        tables=tables,
    )