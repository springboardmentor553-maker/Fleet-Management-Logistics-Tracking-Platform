"""align vehicles table with current model

Revision ID: 596923c8893a
Revises: 2c3e30562e25
Create Date: 2026-08-19 10:13:16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "596923c8893a"
down_revision: Union[str, Sequence[str], None] = "2c3e30562e25"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        column["name"]
        for column in inspector.get_columns("vehicles")
    }

    # Add only columns that are missing.
    # Existing columns/data are preserved.

    if "make" not in columns:
        op.add_column(
            "vehicles",
            sa.Column("make", sa.String(100), nullable=True),
        )

    if "model" not in columns:
        op.add_column(
            "vehicles",
            sa.Column("model", sa.String(100), nullable=True),
        )

    if "year" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "year",
                sa.Integer(),
                nullable=True,
                server_default="2026",
            ),
        )

    if "license_plate" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "license_plate",
                sa.String(20),
                nullable=True,
            ),
        )

    if "vin" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "vin",
                sa.String(17),
                nullable=True,
            ),
        )

    if "status" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "status",
                sa.String(50),
                nullable=True,
                server_default="active",
            ),
        )

    if "capacity_weight" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "capacity_weight",
                sa.Float(),
                nullable=True,
            ),
        )

    if "capacity_volume" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "capacity_volume",
                sa.Float(),
                nullable=True,
            ),
        )

    if "created_at" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=True,
            ),
        )

    if "updated_at" not in columns:
        op.add_column(
            "vehicles",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=True,
            ),
        )


def downgrade() -> None:
    # Do not automatically remove columns because this migration
    # may have only added columns that were missing.
    pass