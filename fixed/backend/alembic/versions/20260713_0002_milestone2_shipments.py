"""milestone 2 - shipment tracking fields

Revision ID: 20260713_0002
Revises: 20260706_0001
Create Date: 2026-07-13 00:02:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260713_0002"
down_revision: Union[str, Sequence[str], None] = "20260706_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the shipment <-> route link; Milestone 2 spec has no route_id field
    op.drop_constraint("fk_shipments_route_id_routes", "shipments", type_="foreignkey")
    op.drop_column("shipments", "route_id")

    # Rename fields to match the Milestone 2 Shipment model spec
    op.alter_column("shipments", "customer_name", new_column_name="sender_name")
    op.add_column("shipments", sa.Column("receiver_name", sa.String(), nullable=True))
    op.alter_column("shipments", "source", new_column_name="pickup_location")
    op.alter_column("shipments", "destination", new_column_name="delivery_location")
    op.drop_column("shipments", "cargo_description")

    op.alter_column("shipments", "vehicle_id", new_column_name="assigned_vehicle_id")
    op.alter_column("shipments", "driver_id", new_column_name="assigned_driver_id")

    op.add_column(
        "shipments",
        sa.Column(
            "created_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )

    # status becomes a constrained set of values (stored as varchar, app-enforced enum)
    op.alter_column(
        "shipments",
        "status",
        type_=sa.String(length=20),
        server_default="Created",
    )


def downgrade() -> None:
    op.alter_column(
        "shipments", "status", type_=sa.String(), server_default="pending"
    )
    op.drop_column("shipments", "created_date")
    op.alter_column("shipments", "assigned_driver_id", new_column_name="driver_id")
    op.alter_column("shipments", "assigned_vehicle_id", new_column_name="vehicle_id")
    op.add_column("shipments", sa.Column("cargo_description", sa.Text(), nullable=True))
    op.alter_column("shipments", "delivery_location", new_column_name="destination")
    op.alter_column("shipments", "pickup_location", new_column_name="source")
    op.drop_column("shipments", "receiver_name")
    op.alter_column("shipments", "sender_name", new_column_name="customer_name")
    op.add_column("shipments", sa.Column("route_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_shipments_route_id_routes", "shipments", "routes", ["route_id"], ["id"]
    )