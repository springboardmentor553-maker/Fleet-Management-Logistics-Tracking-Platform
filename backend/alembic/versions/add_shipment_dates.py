"""add pickup and delivery dates to shipments

Revision ID: add_shipment_dates
Revises: a8bceae6041c
"""

from alembic import op
import sqlalchemy as sa


revision = "add_shipment_dates"
down_revision = "a8bceae6041c"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "shipments",
        sa.Column(
            "pickup_date",
            sa.DateTime(),
            nullable=True
        )
    )

    op.add_column(
        "shipments",
        sa.Column(
            "delivery_date",
            sa.DateTime(),
            nullable=True
        )
    )


def downgrade():
    op.drop_column("shipments", "delivery_date")
    op.drop_column("shipments", "pickup_date")