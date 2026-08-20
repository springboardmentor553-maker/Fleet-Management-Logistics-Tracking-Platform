"""Add fuel trip details

Revision ID: d6c3d3d48b86
Revises: a78c423045e3
Create Date: 2026-08-19 22:37:14.794455

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# ==========================================================
# REVISION IDENTIFIERS
# ==========================================================

revision: str = "d6c3d3d48b86"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "a78c423045e3"

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
    # ADD TRIP ID
    # ------------------------------------------------------

    op.add_column(
        "fuel_records",
        sa.Column(
            "trip_id",
            sa.Integer(),
            nullable=True,
        ),
    )


    # ------------------------------------------------------
    # ADD ODOMETER
    # ------------------------------------------------------

    op.add_column(
        "fuel_records",
        sa.Column(
            "odometer_km",
            sa.Float(),
            nullable=True,
        ),
    )


    # ------------------------------------------------------
    # ADD FUEL TYPE
    # ------------------------------------------------------

    op.add_column(
        "fuel_records",
        sa.Column(
            "fuel_type",
            sa.String(length=30),
            nullable=True,
        ),
    )


    # ------------------------------------------------------
    # ADD NOTES
    # ------------------------------------------------------

    op.add_column(
        "fuel_records",
        sa.Column(
            "notes",
            sa.String(length=500),
            nullable=True,
        ),
    )


    # ------------------------------------------------------
    # INDEX FOR TRIP ID
    # ------------------------------------------------------

    op.create_index(
        op.f("ix_fuel_records_trip_id"),
        "fuel_records",
        ["trip_id"],
        unique=False,
    )


    # ------------------------------------------------------
    # TRIP FOREIGN KEY
    # ------------------------------------------------------

    op.create_foreign_key(
        "fk_fuel_records_trip_id_trips",
        "fuel_records",
        "trips",
        ["trip_id"],
        ["id"],
        ondelete="SET NULL",
    )


# ==========================================================
# DOWNGRADE
# ==========================================================

def downgrade() -> None:

    # ------------------------------------------------------
    # REMOVE FOREIGN KEY
    # ------------------------------------------------------

    op.drop_constraint(
        "fk_fuel_records_trip_id_trips",
        "fuel_records",
        type_="foreignkey",
    )


    # ------------------------------------------------------
    # REMOVE INDEX
    # ------------------------------------------------------

    op.drop_index(
        op.f("ix_fuel_records_trip_id"),
        table_name="fuel_records",
    )


    # ------------------------------------------------------
    # REMOVE COLUMNS
    # ------------------------------------------------------

    op.drop_column(
        "fuel_records",
        "notes",
    )

    op.drop_column(
        "fuel_records",
        "fuel_type",
    )

    op.drop_column(
        "fuel_records",
        "odometer_km",
    )

    op.drop_column(
        "fuel_records",
        "trip_id",
    )