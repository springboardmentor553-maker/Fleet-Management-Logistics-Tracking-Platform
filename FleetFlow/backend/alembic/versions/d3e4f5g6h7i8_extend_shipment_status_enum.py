"""Extend shipment status enum with PICKED_UP and OUT_FOR_DELIVERY

Revision ID: d3e4f5g6h7i8
Revises: c2d3e4f5g6h7
Create Date: 2026-07-17 20:00:00.000000

PostgreSQL does not support removing enum values, but adding new ones
is safe via ALTER TYPE ... ADD VALUE (idempotent with IF NOT EXISTS
which requires PG 9.6+).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3e4f5g6h7i8'
down_revision: Union[str, Sequence[str], None] = 'c2d3e4f5g6h7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add PICKED_UP and OUT_FOR_DELIVERY to the shipmentstatusenum type."""
    conn = op.get_bind()

    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in Postgres.
    # Alembic wraps everything in a transaction by default, so we must
    # commit it first, then run the DDL outside the transaction.
    conn.execute(sa.text("COMMIT"))

    conn.execute(sa.text(
        "ALTER TYPE shipmentstatusenum ADD VALUE IF NOT EXISTS 'PICKED_UP' "
        "AFTER 'ASSIGNED'"
    ))
    conn.execute(sa.text(
        "ALTER TYPE shipmentstatusenum ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY' "
        "AFTER 'IN_TRANSIT'"
    ))


def downgrade() -> None:
    """
    Postgres cannot DROP individual enum values without recreating the type.
    This downgrade is intentionally left as a no-op – the extra values are
    harmless and removing them would require a full column rebuild.
    """
    pass
