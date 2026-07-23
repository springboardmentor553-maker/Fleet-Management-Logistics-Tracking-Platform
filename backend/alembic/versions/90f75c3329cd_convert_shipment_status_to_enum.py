"""convert shipment status to enum

Revision ID: 90f75c3329cd
Revises: be72e2d7b239
Create Date: 2026-07-19 12:17:25.138814

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "90f75c3329cd"
down_revision: Union[str, Sequence[str], None] = "be72e2d7b239"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    shipment_status = sa.Enum(
        "CREATED",
        "ASSIGNED",
        "IN_TRANSIT",
        "DELIVERED",
        "DELAYED",
        "CANCELLED",
        name="shipmentstatus"
    )

    # Create PostgreSQL enum type
    shipment_status.create(op.get_bind(), checkfirst=True)

    # Convert existing string values to match enum values
    op.execute("""
        UPDATE shipments
        SET status = 'CREATED'
        WHERE status = 'Created';
    """)

    op.execute("""
        UPDATE shipments
        SET status = 'ASSIGNED'
        WHERE status = 'Assigned';
    """)

    op.execute("""
        UPDATE shipments
        SET status = 'IN_TRANSIT'
        WHERE status = 'In Transit';
    """)

    op.execute("""
        UPDATE shipments
        SET status = 'DELIVERED'
        WHERE status = 'Delivered';
    """)

    op.execute("""
        UPDATE shipments
        SET status = 'DELAYED'
        WHERE status = 'Delayed';
    """)

    op.execute("""
        UPDATE shipments
        SET status = 'CANCELLED'
        WHERE status = 'Cancelled';
    """)

    # Convert VARCHAR column to Enum
    op.alter_column(
        "shipments",
        "status",
        existing_type=sa.VARCHAR(),
        type_=shipment_status,
        existing_nullable=False,
        postgresql_using="status::shipmentstatus",
    )


def downgrade() -> None:
    shipment_status = sa.Enum(
        "CREATED",
        "ASSIGNED",
        "IN_TRANSIT",
        "DELIVERED",
        "DELAYED",
        "CANCELLED",
        name="shipmentstatus"
    )

    op.alter_column(
        "shipments",
        "status",
        existing_type=shipment_status,
        type_=sa.VARCHAR(),
        existing_nullable=False,
        postgresql_using="status::text",
    )

    shipment_status.drop(op.get_bind(), checkfirst=True)