from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a8bceae6041c'
down_revision: Union[str, Sequence[str], None] = 'd41ca556fad3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'maintenance_alerts',

        sa.Column(
            'id',
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),

        sa.Column(
            'vehicle_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'maintenance_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'alert_message',
            sa.String(),
            nullable=False
        ),

        sa.Column(
            'alert_type',
            sa.String(),
            nullable=False
        ),

        sa.Column(
            'alert_status',
            sa.String(),
            nullable=False,
            server_default='Pending'
        ),

        sa.Column(
            'generated_date',
            sa.Date(),
            nullable=False
        ),

        sa.Column(
            'next_service_date',
            sa.Date(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ['vehicle_id'],
            ['vehicles.id']
        ),

        sa.ForeignKeyConstraint(
            ['maintenance_id'],
            ['maintenance.id']
        ),
    )


def downgrade() -> None:
    op.drop_table('maintenance_alerts')
