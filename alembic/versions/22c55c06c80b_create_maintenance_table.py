"""create maintenance table

Revision ID: 22c55c06c80b
Revises: 9b3fca8810d9
Create Date: 2026-07-28 15:14:52.228309

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "22c55c06c80b"
down_revision: Union[str, Sequence[str], None] = "9b3fca8810d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "maintenance",
        sa.Column("maintenance_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=True),
        sa.Column("maintenance_category", sa.String(), nullable=True),
        sa.Column("service_date", sa.DateTime(), nullable=True),
        sa.Column("next_service_date", sa.DateTime(), nullable=True),
        sa.Column("service_cost", sa.Float(), nullable=True),
        sa.Column("service_provider", sa.String(), nullable=True),
        sa.Column("maintenance_status", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.vehicle_id"]),
        sa.PrimaryKeyConstraint("maintenance_id"),
    )

    op.create_index(
        op.f("ix_maintenance_maintenance_id"),
        "maintenance",
        ["maintenance_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_maintenance_maintenance_id"),
        table_name="maintenance",
    )

    op.drop_table("maintenance")