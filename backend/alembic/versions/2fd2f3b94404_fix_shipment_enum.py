"""fix_shipment_enum

Revision ID: 2fd2f3b94404
Revises: 7d4890a95689
Create Date: 2026-08-18 20:26:30.566574

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fd2f3b94404'
down_revision: Union[str, Sequence[str], None] = '7d4890a95689'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Need to commit the transaction since ALTER TYPE cannot run inside a transaction block
    op.execute("COMMIT")
    op.execute("ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'picked_up'")
    op.execute("ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'out_for_delivery'")
    op.execute("ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'delayed'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
