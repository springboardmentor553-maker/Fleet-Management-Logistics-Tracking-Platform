"""Initial migration

Revision ID: f67c4c4b404b
Revises:
Create Date: 2026-07-05 11:58:39.004167
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f67c4c4b404b"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("license_number", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("license_number"),
    )
    op.create_index(op.f("ix_drivers_id"), "drivers", ["id"], unique=False)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_number", sa.String(), nullable=False),
        sa.Column("vehicle_type", sa.String(), nullable=False),
        sa.Column("capacity", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vehicle_number"),
    )
    op.create_index(op.f("ix_vehicles_id"), "vehicles", ["id"], unique=False)
    op.create_table(
        "shipments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("destination", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("vehicle_id", sa.Integer(), nullable=True),
        sa.Column("driver_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shipments_id"), "shipments", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_shipments_id"), table_name="shipments")
    op.drop_table("shipments")
    op.drop_index(op.f("ix_vehicles_id"), table_name="vehicles")
    op.drop_table("vehicles")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_drivers_id"), table_name="drivers")
    op.drop_table("drivers")
