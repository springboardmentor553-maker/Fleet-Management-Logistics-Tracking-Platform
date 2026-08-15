"""update_shipment_model

Revision ID: 06bb7c963b7a
Revises: 647861e7f20c
Create Date: 2026-07-16 13:37:15.223832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '06bb7c963b7a'
down_revision: Union[str, Sequence[str], None] = '647861e7f20c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Truncate shipments table to avoid type/constraint violation with existing seed data
    op.execute("TRUNCATE TABLE shipments CASCADE")

    # Drop existing index and foreign keys
    op.drop_index(op.f('ix_shipments_shipment_number'), table_name='shipments')
    op.drop_constraint('shipments_vehicle_id_fkey', 'shipments', type_='foreignkey')
    op.drop_constraint('shipments_driver_id_fkey', 'shipments', type_='foreignkey')
    
    # Drop columns using old enum and old names
    op.drop_column('shipments', 'status')
    op.drop_column('shipments', 'origin')
    op.drop_column('shipments', 'destination')
    op.drop_column('shipments', 'vehicle_id')
    op.drop_column('shipments', 'driver_id')
    op.drop_column('shipments', 'estimated_delivery')
    op.drop_column('shipments', 'volume')
    op.drop_column('shipments', 'updated_at')
    op.drop_column('shipments', 'shipment_number')
    op.drop_column('shipments', 'actual_delivery')

    # Drop the old enum type from Postgres
    op.execute("DROP TYPE shipment_status")
    
    # Create the new enum type in DB
    shipment_status = postgresql.ENUM('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED', name='shipment_status')
    shipment_status.create(op.get_bind(), checkfirst=False)

    # Add the new columns
    op.add_column('shipments', sa.Column('tracking_number', sa.String(length=100), nullable=False))
    op.add_column('shipments', sa.Column('sender_name', sa.String(length=255), nullable=False))
    op.add_column('shipments', sa.Column('receiver_name', sa.String(length=255), nullable=False))
    op.add_column('shipments', sa.Column('pickup_location', sa.String(length=255), nullable=False))
    op.add_column('shipments', sa.Column('delivery_location', sa.String(length=255), nullable=False))
    op.add_column('shipments', sa.Column('current_status', sa.Enum('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED', name='shipment_status'), nullable=False))
    op.add_column('shipments', sa.Column('assigned_driver_id', sa.Integer(), nullable=True))
    op.add_column('shipments', sa.Column('assigned_vehicle_id', sa.Integer(), nullable=True))
    
    # Create new index and foreign keys
    op.create_index(op.f('ix_shipments_tracking_number'), 'shipments', ['tracking_number'], unique=True)
    op.create_foreign_key(None, 'shipments', 'vehicles', ['assigned_vehicle_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'shipments', 'drivers', ['assigned_driver_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    # Truncate shipments table to avoid violation
    op.execute("TRUNCATE TABLE shipments CASCADE")

    # Drop new index and foreign keys
    op.drop_index(op.f('ix_shipments_tracking_number'), table_name='shipments')
    op.drop_constraint(op.f('shipments_assigned_vehicle_id_fkey'), 'shipments', type_='foreignkey')
    op.drop_constraint(op.f('shipments_assigned_driver_id_fkey'), 'shipments', type_='foreignkey')

    # Drop new columns
    op.drop_column('shipments', 'tracking_number')
    op.drop_column('shipments', 'sender_name')
    op.drop_column('shipments', 'receiver_name')
    op.drop_column('shipments', 'pickup_location')
    op.drop_column('shipments', 'delivery_location')
    op.drop_column('shipments', 'current_status')
    op.drop_column('shipments', 'assigned_driver_id')
    op.drop_column('shipments', 'assigned_vehicle_id')

    # Drop new enum type
    op.execute("DROP TYPE shipment_status")

    # Create old enum type
    old_shipment_status = postgresql.ENUM('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', name='shipment_status')
    old_shipment_status.create(op.get_bind(), checkfirst=False)

    # Re-add old columns
    op.add_column('shipments', sa.Column('shipment_number', sa.VARCHAR(length=100), nullable=False))
    op.add_column('shipments', sa.Column('origin', sa.VARCHAR(length=255), nullable=False))
    op.add_column('shipments', sa.Column('destination', sa.VARCHAR(length=255), nullable=False))
    op.add_column('shipments', sa.Column('status', sa.Enum('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', name='shipment_status'), nullable=False))
    op.add_column('shipments', sa.Column('volume', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('estimated_delivery', sa.DateTime(timezone=True), nullable=True))
    op.add_column('shipments', sa.Column('actual_delivery', sa.DateTime(timezone=True), nullable=True))
    op.add_column('shipments', sa.Column('driver_id', sa.Integer(), nullable=True))
    op.add_column('shipments', sa.Column('vehicle_id', sa.Integer(), nullable=True))
    op.add_column('shipments', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # Re-create old index and foreign keys
    op.create_index(op.f('ix_shipments_shipment_number'), 'shipments', ['shipment_number'], unique=True)
    op.create_foreign_key(op.f('shipments_driver_id_fkey'), 'shipments', 'drivers', ['driver_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(op.f('shipments_vehicle_id_fkey'), 'shipments', 'vehicles', ['vehicle_id'], ['id'], ondelete='SET NULL')
