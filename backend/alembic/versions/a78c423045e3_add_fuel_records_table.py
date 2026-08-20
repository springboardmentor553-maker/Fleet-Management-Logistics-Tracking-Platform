"""Add fuel records table

Revision ID: a78c423045e3
Revises: 2b0a6b981ae0
Create Date: 2026-08-19 22:20:08.039824

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# ==========================================================
# REVISION IDENTIFIERS
# ==========================================================

revision: str = "a78c423045e3"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "2b0a6b981ae0"

branch_labels: Union[
    str,
    Sequence[str],
    None
] = None

depends_on: Union[
    str,
    Sequence[str],
    None
] = None


# ==========================================================
# UPGRADE
# ==========================================================

def upgrade() -> None:

    # ------------------------------------------------------
    # CREATE FUEL RECORDS TABLE
    # ------------------------------------------------------

    op.create_table(
        "fuel_records",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "vehicle_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "fuel_consumed_liters",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "distance_km",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),
    )


    # ------------------------------------------------------
    # INDEXES
    # ------------------------------------------------------

    op.create_index(
        op.f("ix_fuel_records_id"),
        "fuel_records",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_fuel_records_vehicle_id"),
        "fuel_records",
        ["vehicle_id"],
        unique=False,
    )


# ==========================================================
# DOWNGRADE
# ==========================================================

def downgrade() -> None:

    # ------------------------------------------------------
    # REMOVE FUEL RECORDS INDEXES
    # ------------------------------------------------------

    op.drop_index(
        op.f("ix_fuel_records_vehicle_id"),
        table_name="fuel_records",
    )

    op.drop_index(
        op.f("ix_fuel_records_id"),
        table_name="fuel_records",
    )


    # ------------------------------------------------------
    # REMOVE FUEL RECORDS TABLE
    # ------------------------------------------------------

    op.drop_table(
        "fuel_records"
    )