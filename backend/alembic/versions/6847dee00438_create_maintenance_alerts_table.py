"""create maintenance alerts table

Revision ID: 6847dee00438
Revises: 6cb4e323d48a
Create Date: 2026-08-04 11:36:14.913432

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "6847dee00438"
down_revision: Union[str, Sequence[str], None] = "6cb4e323d48a"
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        "maintenance_alerts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),

        sa.Column(
            "vehicle_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "maintenance_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "alert_message",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "alert_type",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "alert_status",
            sa.String(),
            nullable=False,
            server_default="Pending"
        ),

        sa.Column(
            "generated_date",
            sa.Date(),
            nullable=False
        ),

        sa.Column(
            "next_service_date",
            sa.Date(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"]
        ),

        sa.ForeignKeyConstraint(
            ["maintenance_id"],
            ["maintenance.id"]
        ),
    )

    op.create_index(
        "ix_maintenance_alerts_id",
        "maintenance_alerts",
        ["id"]
    )


def downgrade() -> None:

    op.drop_index(
        "ix_maintenance_alerts_id",
        table_name="maintenance_alerts"
    )

    op.drop_table("maintenance_alerts")