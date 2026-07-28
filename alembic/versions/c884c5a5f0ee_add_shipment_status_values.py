"""Add shipment status values

Revision ID: c884c5a5f0ee
Revises: 134f5261f8b8
Create Date: 2026-07-17 22:04:48.317628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c884c5a5f0ee'
down_revision: Union[str, Sequence[str], None] = '134f5261f8b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute(
        "ALTER TYPE shipmentstatus ADD VALUE IF NOT EXISTS 'PICKED_UP';"
    )

    op.execute(
        "ALTER TYPE shipmentstatus ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';"
    )



def downgrade() -> None:
    """Downgrade schema."""
    pass
