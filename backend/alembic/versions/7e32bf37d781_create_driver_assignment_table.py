"""Create driver assignment table

Revision ID: 7e32bf37d781
Revises: 75c2f1568981
Create Date: 2026-07-27 20:39:51.220454
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7e32bf37d781"
down_revision: Union[str, Sequence[str], None] = "75c2f1568981"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "driver_assignments",

        sa.Column("id", sa.Integer(), primary_key=True),

        sa.Column(
            "driver_id",
            sa.Integer(),
            sa.ForeignKey("drivers.id"),
            nullable=False,
        ),

        sa.Column(
            "vehicle_id",
            sa.Integer(),
            sa.ForeignKey("vehicles.id"),
            nullable=False,
        ),

        sa.Column(
            "trip_id",
            sa.Integer(),
            sa.ForeignKey("trips.id"),
            nullable=False,
        ),

        sa.Column(
            "assignment_date",
            sa.Date(),
            nullable=False,
        ),

        sa.Column(
            "release_date",
            sa.Date(),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="Assigned",
        ),

        sa.Column(
            "remarks",
            sa.String(),
            nullable=True,
        ),
    )


def downgrade() -> None:

    op.drop_table("driver_assignments")