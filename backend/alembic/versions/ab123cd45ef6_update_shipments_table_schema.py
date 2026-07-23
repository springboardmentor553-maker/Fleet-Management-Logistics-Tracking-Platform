"""Update shipments table schema

Revision ID: ab123cd45ef6
Revises: dc210bcd2c34
Create Date: 2026-07-23 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'ab123cd45ef6'
down_revision: Union[str, Sequence[str], None] = 'dc210bcd2c34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade shipments table schema to match SQLAlchemy model."""
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_columns = [col['name'] for col in inspector.get_columns('shipments')]

    # 1. Rename 'shipment_name' -> 'sender_name', or add 'sender_name' if missing
    if 'shipment_name' in existing_columns and 'sender_name' not in existing_columns:
        op.alter_column('shipments', 'shipment_name', new_column_name='sender_name', existing_type=sa.String(100), nullable=False)
    elif 'sender_name' not in existing_columns:
        op.add_column('shipments', sa.Column('sender_name', sa.String(length=100), nullable=False, server_default='Default Sender'))

    # 2. Add 'receiver_name' if missing
    if 'receiver_name' not in existing_columns:
        op.add_column('shipments', sa.Column('receiver_name', sa.String(length=100), nullable=False, server_default='Default Receiver'))

    # 3. Rename 'source' -> 'pickup_location'
    if 'source' in existing_columns and 'pickup_location' not in existing_columns:
        op.alter_column('shipments', 'source', new_column_name='pickup_location', existing_type=sa.String(100), nullable=False)
    elif 'pickup_location' not in existing_columns:
        op.add_column('shipments', sa.Column('pickup_location', sa.String(length=100), nullable=False, server_default='Default Pickup'))

    # 4. Rename 'destination' -> 'delivery_location'
    if 'destination' in existing_columns and 'delivery_location' not in existing_columns:
        op.alter_column('shipments', 'destination', new_column_name='delivery_location', existing_type=sa.String(100), nullable=False)
    elif 'delivery_location' not in existing_columns:
        op.add_column('shipments', sa.Column('delivery_location', sa.String(length=100), nullable=False, server_default='Default Delivery'))

    # 5. Rename 'status' -> 'current_status'
    if 'status' in existing_columns and 'current_status' not in existing_columns:
        op.alter_column('shipments', 'status', new_column_name='current_status', existing_type=sa.String(50), nullable=False)
    elif 'current_status' not in existing_columns:
        op.add_column('shipments', sa.Column('current_status', sa.String(length=50), nullable=False, server_default='Created'))

    # 6. Add 'tracking_number' if missing
    if 'tracking_number' not in existing_columns:
        op.add_column('shipments', sa.Column('tracking_number', sa.String(length=100), nullable=True))
        # Backfill tracking numbers for existing rows if any exist
        op.execute("UPDATE shipments SET tracking_number = 'FLT' || LPAD(id::text, 6, '0') WHERE tracking_number IS NULL")
        op.alter_column('shipments', 'tracking_number', nullable=False)
        op.create_unique_constraint('uq_shipments_tracking_number', 'shipments', ['tracking_number'])

    # 7. Add 'weight' if missing
    if 'weight' not in existing_columns:
        op.add_column('shipments', sa.Column('weight', sa.Float(), nullable=True))

    # 8. Add 'created_date' if missing
    if 'created_date' not in existing_columns:
        op.add_column('shipments', sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')))

    # 9. Rename 'vehicle_id' -> 'assigned_vehicle_id'
    if 'vehicle_id' in existing_columns and 'assigned_vehicle_id' not in existing_columns:
        op.alter_column('shipments', 'vehicle_id', new_column_name='assigned_vehicle_id', existing_type=sa.Integer(), nullable=True)
    elif 'assigned_vehicle_id' not in existing_columns:
        op.add_column('shipments', sa.Column('assigned_vehicle_id', sa.Integer(), sa.ForeignKey('vehicles.id'), nullable=True))

    # 10. Add 'assigned_driver_id' if missing
    if 'assigned_driver_id' not in existing_columns:
        op.add_column('shipments', sa.Column('assigned_driver_id', sa.Integer(), sa.ForeignKey('drivers.id'), nullable=True))


def downgrade() -> None:
    """Downgrade shipments table schema."""
    op.drop_column('shipments', 'assigned_driver_id')
    op.alter_column('shipments', 'assigned_vehicle_id', new_column_name='vehicle_id')
    op.drop_column('shipments', 'created_date')
    op.drop_column('shipments', 'weight')
    op.drop_constraint('uq_shipments_tracking_number', 'shipments', type_='unique')
    op.drop_column('shipments', 'tracking_number')
    op.alter_column('shipments', 'current_status', new_column_name='status')
    op.alter_column('shipments', 'delivery_location', new_column_name='destination')
    op.alter_column('shipments', 'pickup_location', new_column_name='source')
    op.drop_column('shipments', 'receiver_name')
    op.alter_column('shipments', 'sender_name', new_column_name='shipment_name')
