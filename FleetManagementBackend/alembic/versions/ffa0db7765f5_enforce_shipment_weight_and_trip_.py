"""enforce shipment weight and trip coordinates

Revision ID: ffa0db7765f5
Revises: 947211bd4603
"""

from typing import Sequence, Union

from alembic import op


revision: str = "ffa0db7765f5"
down_revision: Union[str, Sequence[str], None] = "947211bd4603"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enforce NOT NULL constraints to match the current SQLAlchemy models.

    op.alter_column(
        "shipments",
        "weight",
        nullable=False,
    )

    op.alter_column(
        "trips",
        "pickup_latitude",
        nullable=False,
    )

    op.alter_column(
        "trips",
        "pickup_longitude",
        nullable=False,
    )

    op.alter_column(
        "trips",
        "destination_latitude",
        nullable=False,
    )

    op.alter_column(
        "trips",
        "destination_longitude",
        nullable=False,
    )


def downgrade() -> None:
    # Restore the previous nullable state.

    op.alter_column(
        "shipments",
        "weight",
        nullable=True,
    )

    op.alter_column(
        "trips",
        "pickup_latitude",
        nullable=True,
    )

    op.alter_column(
        "trips",
        "pickup_longitude",
        nullable=True,
    )

    op.alter_column(
        "trips",
        "destination_latitude",
        nullable=True,
    )

    op.alter_column(
        "trips",
        "destination_longitude",
        nullable=True,
    )