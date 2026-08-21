"""update shipment model

Revision ID: be72e2d7b239
Revises: 7f8e47f85fa7
Create Date: 2026-07-19 11:52:54.479130

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "be72e2d7b239"

down_revision: Union[str, Sequence[str], None] = "7f8e47f85fa7"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Update the existing shipments table."""

    op.add_column(
        "shipments",
        sa.Column(
            "tracking_number",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "sender_name",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "receiver_name",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "pickup_location",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "delivery_location",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "weight",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "created_date",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "assigned_driver_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "assigned_vehicle_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_unique_constraint(
        "uq_shipments_tracking_number",
        "shipments",
        ["tracking_number"],
    )

    op.create_foreign_key(
        "fk_shipments_assigned_driver",
        "shipments",
        "drivers",
        ["assigned_driver_id"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_shipments_assigned_vehicle",
        "shipments",
        "vehicles",
        ["assigned_vehicle_id"],
        ["id"],
    )

    # Existing rows need valid values before making the
    # new fields non-nullable.
    op.execute(
        """
        UPDATE shipments
        SET tracking_number = 'LEGACY-' || id
        WHERE tracking_number IS NULL
        """
    )

    op.execute(
        """
        UPDATE shipments
        SET sender_name = 'Unknown Sender'
        WHERE sender_name IS NULL
        """
    )

    op.execute(
        """
        UPDATE shipments
        SET receiver_name = 'Unknown Receiver'
        WHERE receiver_name IS NULL
        """
    )

    op.execute(
        """
        UPDATE shipments
        SET pickup_location = source
        WHERE pickup_location IS NULL
        """
    )

    op.execute(
        """
        UPDATE shipments
        SET delivery_location = destination
        WHERE delivery_location IS NULL
        """
    )

    op.execute(
        """
        UPDATE shipments
        SET weight = 0
        WHERE weight IS NULL
        """
    )

    op.alter_column(
        "shipments",
        "tracking_number",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "sender_name",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "receiver_name",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "pickup_location",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "delivery_location",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "weight",
        nullable=False,
    )


def downgrade() -> None:
    """Revert shipment model changes."""

    op.drop_constraint(
        "fk_shipments_assigned_vehicle",
        "shipments",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_shipments_assigned_driver",
        "shipments",
        type_="foreignkey",
    )

    op.drop_constraint(
        "uq_shipments_tracking_number",
        "shipments",
        type_="unique",
    )

    op.drop_column(
        "shipments",
        "assigned_vehicle_id",
    )

    op.drop_column(
        "shipments",
        "assigned_driver_id",
    )

    op.drop_column(
        "shipments",
        "created_date",
    )

    op.drop_column(
        "shipments",
        "weight",
    )

    op.drop_column(
        "shipments",
        "delivery_location",
    )

    op.drop_column(
        "shipments",
        "pickup_location",
    )

    op.drop_column(
        "shipments",
        "receiver_name",
    )

    op.drop_column(
        "shipments",
        "sender_name",
    )

    op.drop_column(
        "shipments",
        "tracking_number",
    )