"""Add origin/destination coords to shipments

Revision ID: 20260713_add_shipment_coords
Revises: c11a3f2d9e01
Create Date: 2026-07-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '20260713_add_shipment_coords'
down_revision = 'c11a3f2d9e01'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('shipments', sa.Column('origin_lat', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('origin_lng', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('destination_lat', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('destination_lng', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('shipments', 'destination_lng')
    op.drop_column('shipments', 'destination_lat')
    op.drop_column('shipments', 'origin_lng')
    op.drop_column('shipments', 'origin_lat')
