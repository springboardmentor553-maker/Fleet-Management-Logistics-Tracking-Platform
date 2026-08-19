"""drop status column from deliveries

Revision ID: ef479a9918dc
Revises: c884c5a5f0ee
Create Date: 2026-07-21 18:51:28.498078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef479a9918dc'
down_revision: Union[str, Sequence[str], None] = 'c884c5a5f0ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     # Remove the duplicate status column
    op.drop_column("deliveries", "status")


def downgrade() -> None:
    # Recreate the status column if rolling back
    op.add_column(
        "deliveries",
        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="PENDING"
        )
    )

    # Remove the server default after existing rows are populated
    op.alter_column(
        "deliveries",
        "status",
        server_default=None
    )
