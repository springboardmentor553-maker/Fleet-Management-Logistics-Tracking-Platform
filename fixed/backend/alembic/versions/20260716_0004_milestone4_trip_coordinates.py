"""milestone 4 - trip coordinates for maps integration

Revision ID: 20260716_0004
Revises: 20260715_0003
Create Date: 2026-07-16 00:04:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260716_0004"
down_revision: Union[str, Sequence[str], None] = "20260715_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("pickup_latitude", sa.Float(), nullable=True))
    op.add_column("trips", sa.Column("pickup_longitude", sa.Float(), nullable=True))
    op.add_column("trips", sa.Column("destination_latitude", sa.Float(), nullable=True))
    op.add_column("trips", sa.Column("destination_longitude", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("trips", "destination_longitude")
    op.drop_column("trips", "destination_latitude")
    op.drop_column("trips", "pickup_longitude")
    op.drop_column("trips", "pickup_latitude")
