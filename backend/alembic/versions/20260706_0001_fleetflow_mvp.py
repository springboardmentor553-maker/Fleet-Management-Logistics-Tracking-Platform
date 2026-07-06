"""fleetflow mvp tables

Revision ID: 20260706_0001
Revises: f67c4c4b404b
Create Date: 2026-07-06 00:01:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260706_0001"
down_revision: Union[str, Sequence[str], None] = "f67c4c4b404b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "drivers",
        sa.Column("status", sa.String(), nullable=False, server_default="available"),
    )
    op.create_index(
        op.f("ix_drivers_license_number"), "drivers", ["license_number"], unique=False
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("level", sa.String(), nullable=False),
        sa.Column("is_read", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)

    op.create_table(
        "routes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("destination", sa.String(), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("estimated_duration_hours", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_routes_id"), "routes", ["id"], unique=False)

    op.add_column(
        "users",
        sa.Column("role", sa.String(), nullable=False, server_default="manager"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.add_column(
        "vehicles",
        sa.Column("status", sa.String(), nullable=False, server_default="available"),
    )
    op.add_column("vehicles", sa.Column("current_location", sa.String(), nullable=True))
    op.create_index(
        op.f("ix_vehicles_vehicle_number"), "vehicles", ["vehicle_number"], unique=False
    )

    op.create_table(
        "maintenance_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cost", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_maintenance_records_id"), "maintenance_records", ["id"], unique=False
    )

    op.add_column(
        "shipments",
        sa.Column(
            "tracking_number",
            sa.String(),
            nullable=False,
            server_default=sa.text("'PENDING-' || nextval('shipments_id_seq')"),
        ),
    )
    op.add_column(
        "shipments",
        sa.Column("customer_name", sa.String(), nullable=False, server_default="Unknown"),
    )
    op.add_column("shipments", sa.Column("cargo_description", sa.Text(), nullable=True))
    op.add_column("shipments", sa.Column("weight", sa.Float(), nullable=True))
    op.add_column("shipments", sa.Column("route_id", sa.Integer(), nullable=True))
    op.alter_column("shipments", "status", nullable=False, server_default="pending")
    op.create_foreign_key(
        "fk_shipments_route_id_routes", "shipments", "routes", ["route_id"], ["id"]
    )
    op.create_unique_constraint(
        "uq_shipments_tracking_number", "shipments", ["tracking_number"]
    )
    op.create_index(
        op.f("ix_shipments_tracking_number"),
        "shipments",
        ["tracking_number"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_shipments_tracking_number"), table_name="shipments")
    op.drop_constraint("uq_shipments_tracking_number", "shipments", type_="unique")
    op.drop_constraint("fk_shipments_route_id_routes", "shipments", type_="foreignkey")
    op.drop_column("shipments", "route_id")
    op.drop_column("shipments", "weight")
    op.drop_column("shipments", "cargo_description")
    op.drop_column("shipments", "customer_name")
    op.drop_column("shipments", "tracking_number")
    op.drop_index(op.f("ix_maintenance_records_id"), table_name="maintenance_records")
    op.drop_table("maintenance_records")
    op.drop_index(op.f("ix_vehicles_vehicle_number"), table_name="vehicles")
    op.drop_column("vehicles", "current_location")
    op.drop_column("vehicles", "status")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_column("users", "role")
    op.drop_index(op.f("ix_routes_id"), table_name="routes")
    op.drop_table("routes")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_drivers_license_number"), table_name="drivers")
    op.drop_column("drivers", "status")
