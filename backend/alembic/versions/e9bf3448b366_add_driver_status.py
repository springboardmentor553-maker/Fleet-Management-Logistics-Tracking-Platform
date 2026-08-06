"""add_driver_status

Revision ID: e9bf3448b366
Revises: c8dd0f00272a
Create Date: 2026-08-06 16:34:57.380078

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e9bf3448b366"
down_revision: Union[str, Sequence[str], None] = "c8dd0f00272a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "drivers",
        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="available"
        )
    )

    # Remove the temporary database default
    op.alter_column(
        "drivers",
        "status",
        server_default=None
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("drivers", "status")