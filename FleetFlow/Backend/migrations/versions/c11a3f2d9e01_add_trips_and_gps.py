"""Add trips table and vehicle GPS fields

Revision ID: c11a3f2d9e01
Revises: b88882ecc2a2
Create Date: 2026-07-09 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c11a3f2d9e01'
down_revision: Union[str, Sequence[str], None] = 'b88882ecc2a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # GPS columns on vehicles
    op.add_column('vehicles', sa.Column('latitude',  sa.Float(), nullable=True))
    op.add_column('vehicles', sa.Column('longitude', sa.Float(), nullable=True))

    # Trips table
    op.create_table(
        'trips',
        sa.Column('id',          sa.Integer(), primary_key=True),
        sa.Column('shipment_id', sa.Integer(), sa.ForeignKey('shipments.id'), nullable=False),
        sa.Column('driver_id',   sa.Integer(), sa.ForeignKey('drivers.id'),   nullable=False),
        sa.Column('vehicle_id',  sa.Integer(), sa.ForeignKey('vehicles.id'),  nullable=False),
        sa.Column('start_time',  sa.DateTime(), nullable=True),
        sa.Column('end_time',    sa.DateTime(), nullable=True),
        sa.Column('status',      sa.String(),  nullable=False, server_default='scheduled'),
        sa.Column('created_at',  sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('trips')
    op.drop_column('vehicles', 'longitude')
    op.drop_column('vehicles', 'latitude')
