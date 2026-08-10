"""fuel_record driver_id make nullable

Revision ID: f2a1b3c4d5e6
Revises: d1353d60b2d5
Create Date: 2026-08-10 11:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a1b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd1353d60b2d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make fuel_records.driver_id nullable (driver is optional)."""
    op.alter_column(
        'fuel_records',
        'driver_id',
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    """Revert fuel_records.driver_id to NOT NULL."""
    op.alter_column(
        'fuel_records',
        'driver_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
