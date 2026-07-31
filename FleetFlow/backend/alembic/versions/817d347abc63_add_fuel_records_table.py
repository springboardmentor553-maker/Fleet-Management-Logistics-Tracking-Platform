"""add_fuel_records_table

Revision ID: 817d347abc63
Revises: ee417dc7edf5
Create Date: 2026-07-31 19:37:22.771395

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '817d347abc63'
down_revision: Union[str, Sequence[str], None] = 'ee417dc7edf5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'fuel_records',
        sa.Column('id',               sa.Integer(),  primary_key=True),
        sa.Column('vehicle_id',       sa.Integer(),  sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('driver_id',        sa.Integer(),  sa.ForeignKey('drivers.id',  ondelete='SET NULL'), nullable=True),
        sa.Column('fuel_quantity',    sa.Float(),    nullable=False),
        sa.Column('fuel_cost',        sa.Float(),    nullable=False),
        sa.Column('odometer_reading', sa.Float(),    nullable=True),
        sa.Column('fuel_date',        sa.Date(),     nullable=False),
        sa.Column('fuel_station',     sa.String(),   nullable=True),
        sa.Column('remarks',          sa.Text(),     nullable=True),
        sa.Column('created_at',       sa.DateTime(), nullable=False),
    )
    op.create_index('ix_fuel_records_vehicle_id', 'fuel_records', ['vehicle_id'])
    op.create_index('ix_fuel_records_driver_id',  'fuel_records', ['driver_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_fuel_records_driver_id',  table_name='fuel_records')
    op.drop_index('ix_fuel_records_vehicle_id', table_name='fuel_records')
    op.drop_table('fuel_records')
