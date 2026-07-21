from alembic import op
import sqlalchemy as sa


revision = '20260715_add_trip_coordinates'
down_revision = 'b36b2ba6b3f0'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('trips')]
    if 'pickup_latitude' not in columns:
        op.add_column('trips', sa.Column('pickup_latitude', sa.Float(), nullable=True))
    if 'pickup_longitude' not in columns:
        op.add_column('trips', sa.Column('pickup_longitude', sa.Float(), nullable=True))
    if 'destination_latitude' not in columns:
        op.add_column('trips', sa.Column('destination_latitude', sa.Float(), nullable=True))
    if 'destination_longitude' not in columns:
        op.add_column('trips', sa.Column('destination_longitude', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('trips', 'destination_longitude')
    op.drop_column('trips', 'destination_latitude')
    op.drop_column('trips', 'pickup_longitude')
    op.drop_column('trips', 'pickup_latitude')
