"""add distance and actual_arrival to trip

Revision ID: 6cb4e323d48a
Revises: 13588c304333
Create Date: 2026-08-01 18:13:47.211437

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6cb4e323d48a"
down_revision: Union[str, Sequence[str], None] = "34198e1db56d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "trips",
        sa.Column(
            "actual_arrival",
            sa.DateTime(),
            nullable=True
        )
    )

    op.add_column(
        "trips",
        sa.Column(
            "distance",
            sa.Float(),
            nullable=True
        )
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "trips",
        "distance"
    )

    op.drop_column(
        "trips",
        "actual_arrival"
    )
