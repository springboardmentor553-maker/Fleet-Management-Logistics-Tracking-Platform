"""add driver_id fuel_station and remarks to fuel_records

Revision ID: 20260803_0002
Revises: 20260706_0001
Create Date: 2026-08-03 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260803_0002"
down_revision: Union[str, Sequence[str], None] = "20260706_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [c["name"] for c in inspector.get_columns("fuel_records")]

    if "driver_id" not in existing_cols:
        op.add_column("fuel_records", sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=True))
    if "fuel_station" not in existing_cols:
        op.add_column("fuel_records", sa.Column("fuel_station", sa.String(), nullable=True))
    if "remarks" not in existing_cols:
        op.add_column("fuel_records", sa.Column("remarks", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [c["name"] for c in inspector.get_columns("fuel_records")]

    if "remarks" in existing_cols:
        op.drop_column("fuel_records", "remarks")
    if "fuel_station" in existing_cols:
        op.drop_column("fuel_records", "fuel_station")
    if "driver_id" in existing_cols:
        op.drop_column("fuel_records", "driver_id")
