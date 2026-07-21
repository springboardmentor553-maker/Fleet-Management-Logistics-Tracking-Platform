"""Add trip coordinate columns

Adds four nullable Float columns to the trips table for storing
geocoded pickup and destination coordinates:
  - pickup_latitude
  - pickup_longitude
  - destination_latitude
  - destination_longitude

Revision ID: b3c8d1e2f9a0
Revises: f7f3e4de6107
Create Date: 2026-07-21 21:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c8d1e2f9a0'
down_revision: Union[str, Sequence[str], None] = 'f7f3e4de6107'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add geocoded coordinate columns to the trips table."""
    op.add_column('trips', sa.Column('pickup_latitude', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('pickup_longitude', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('destination_latitude', sa.Float(), nullable=True))
    op.add_column('trips', sa.Column('destination_longitude', sa.Float(), nullable=True))


def downgrade() -> None:
    """Remove geocoded coordinate columns from the trips table."""
    op.drop_column('trips', 'destination_longitude')
    op.drop_column('trips', 'destination_latitude')
    op.drop_column('trips', 'pickup_longitude')
    op.drop_column('trips', 'pickup_latitude')
