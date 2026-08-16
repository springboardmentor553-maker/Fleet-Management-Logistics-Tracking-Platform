"""Add coordinate columns to trips table

Revision ID: c2d3e4f5g6h7
Revises: b1c2d3e4f5g6
Create Date: 2026-07-15 19:30:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c2d3e4f5g6h7'
down_revision: str | Sequence[str] | None = 'b1c2d3e4f5g6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add pickup and destination coordinate columns to trips table."""
    op.add_column('trips', sa.Column('pickup_lat', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('pickup_lng', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('destination_lat', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('destination_lng', sa.Float(), nullable=True))


def downgrade() -> None:
    """Remove coordinate columns from trips table."""
    op.drop_column('trips', 'destination_lng')
    op.drop_column('trips', 'destination_lat')
    op.drop_column('trips', 'pickup_lng')
    op.drop_column('trips', 'pickup_lat')
