"""create maintenance table

Revision ID: 22c55c06c80b
Revises: 9b3fca8810d9
Create Date: 2026-07-28 15:14:52.228309
"""

from typing import Sequence, Union

from alembic import op
from app.database import Base
from app import models


revision: str = "22c55c06c80b"
down_revision: Union[str, Sequence[str], None] = "9b3fca8810d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create maintenance first.
    maintenance = Base.metadata.tables["maintenance"]
    maintenance.create(bind=bind, checkfirst=True)

    # maintenance_alerts depends on maintenance.
    maintenance_alerts = Base.metadata.tables["maintenance_alerts"]
    maintenance_alerts.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()

    maintenance_alerts = Base.metadata.tables["maintenance_alerts"]
    maintenance_alerts.drop(bind=bind, checkfirst=True)

    maintenance = Base.metadata.tables["maintenance"]
    maintenance.drop(bind=bind, checkfirst=True)