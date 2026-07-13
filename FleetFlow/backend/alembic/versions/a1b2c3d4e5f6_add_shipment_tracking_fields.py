"""Add shipment tracking fields

Revision ID: a1b2c3d4e5f6
Revises: 53615c186099
Create Date: 2026-07-13 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '53615c186099'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns to shipments table for full shipment tracking."""
    # Add tracking_number column (unique, indexed)
    op.add_column('shipments',
        sa.Column('tracking_number', sa.String(), nullable=True)
    )
    # Add sender / receiver info
    op.add_column('shipments',
        sa.Column('sender_name', sa.String(), nullable=True)
    )
    op.add_column('shipments',
        sa.Column('receiver_name', sa.String(), nullable=True)
    )
    # Add location fields
    op.add_column('shipments',
        sa.Column('pickup_location', sa.String(), nullable=True)
    )
    op.add_column('shipments',
        sa.Column('delivery_location', sa.String(), nullable=True)
    )
    # Add cargo weight
    op.add_column('shipments',
        sa.Column('weight', sa.Float(), nullable=True)
    )

    # Backfill existing rows with safe defaults so we can add NOT NULL constraints
    op.execute(
        "UPDATE shipments SET "
        "tracking_number = CONCAT('FLT1', LPAD(CAST(id AS VARCHAR), 5, '0')), "
        "sender_name = 'Unknown', "
        "receiver_name = 'Unknown', "
        "pickup_location = 'Unknown', "
        "delivery_location = 'Unknown', "
        "weight = 0.0 "
        "WHERE tracking_number IS NULL"
    )

    # Now add the unique index on tracking_number
    op.create_index('ix_shipments_tracking_number', 'shipments', ['tracking_number'], unique=True)

    # Make created_at non-nullable with a server default
    op.alter_column('shipments', 'created_at',
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=sa.text('NOW()'),
    )


def downgrade() -> None:
    """Remove the columns added in this migration."""
    op.drop_index('ix_shipments_tracking_number', table_name='shipments')
    op.drop_column('shipments', 'weight')
    op.drop_column('shipments', 'delivery_location')
    op.drop_column('shipments', 'pickup_location')
    op.drop_column('shipments', 'receiver_name')
    op.drop_column('shipments', 'sender_name')
    op.drop_column('shipments', 'tracking_number')
    op.alter_column('shipments', 'created_at',
        existing_type=sa.DateTime(),
        nullable=True,
        server_default=None,
    )
