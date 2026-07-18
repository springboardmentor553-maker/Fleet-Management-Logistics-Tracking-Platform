"""milestone 3 - trip model and assignments

Revision ID: 20260715_0003
Revises: 20260713_0002
Create Date: 2026-07-15 00:03:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260715_0003"
down_revision: Union[str, Sequence[str], None] = "20260713_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "shipment_id",
            sa.Integer(),
            sa.ForeignKey("shipments.id"),
            unique=True,
            nullable=False,
        ),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("pickup_location", sa.String(), nullable=False),
        sa.Column("destination", sa.String(), nullable=False),
        sa.Column("scheduled_start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="Scheduled",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index(op.f("ix_trips_id"), "trips", ["id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_trips_id"), table_name="trips")
    op.drop_table("trips")
