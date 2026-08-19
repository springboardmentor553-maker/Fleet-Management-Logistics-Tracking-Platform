"""create shipments table

Revision ID: 9f869755ab5e
Revises: 1f00fdc4a5cf
Create Date: 2026-07-16 17:42:20.348042

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '9f869755ab5e'
down_revision: Union[str, Sequence[str], None] = '1f00fdc4a5cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    """Upgrade schema."""

    shipment_status = sa.Enum(
        'CREATED',
        'ASSIGNED',
        'IN_TRANSIT',
        'DELAYED',
        'DELIVERED',
        'CANCELLED',
        name='shipmentstatus'
    )


    # Create PostgreSQL ENUM type
    shipment_status.create(
        op.get_bind(),
        checkfirst=True
    )


    # Change status column
    op.execute(
    """
    ALTER TABLE shipments
    ALTER COLUMN status TYPE shipmentstatus
    USING status::shipmentstatus
    """
    )


    # Change weight column
    op.alter_column(
        'shipments',
        'weight',
        existing_type=sa.INTEGER(),
        type_=sa.Float(),
        nullable=True
    )



def downgrade() -> None:
    """Downgrade schema."""


    op.alter_column(
        'shipments',
        'weight',
        existing_type=sa.Float(),
        type_=sa.INTEGER(),
        nullable=False
    )


    op.alter_column(
        'shipments',
        'status',
        existing_type=sa.Enum(
            'CREATED',
            'ASSIGNED',
            'IN_TRANSIT',
            'DELAYED',
            'DELIVERED',
            'CANCELLED',
            name='shipmentstatus'
        ),
        type_=sa.VARCHAR(),
        existing_nullable=True
    )


    # Remove enum type
    sa.Enum(
        name='shipmentstatus'
    ).drop(
        op.get_bind(),
        checkfirst=True
    )