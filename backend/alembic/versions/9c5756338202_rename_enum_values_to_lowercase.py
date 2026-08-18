"""rename enum values to lowercase

Revision ID: 9c5756338202
Revises: 2fd2f3b94404
Create Date: 2026-08-18 22:12:48.927129

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c5756338202'
down_revision: Union[str, Sequence[str], None] = '2fd2f3b94404'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safe rename for shipment_status
    op.execute('''
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'shipment_status' AND enumlabel = 'CREATED') THEN
            ALTER TYPE shipment_status RENAME VALUE 'CREATED' TO 'created';
            ALTER TYPE shipment_status RENAME VALUE 'ASSIGNED' TO 'assigned';
            ALTER TYPE shipment_status RENAME VALUE 'PICKED_UP' TO 'picked_up';
            ALTER TYPE shipment_status RENAME VALUE 'IN_TRANSIT' TO 'in_transit';
            ALTER TYPE shipment_status RENAME VALUE 'OUT_FOR_DELIVERY' TO 'out_for_delivery';
            ALTER TYPE shipment_status RENAME VALUE 'DELAYED' TO 'delayed';
            ALTER TYPE shipment_status RENAME VALUE 'DELIVERED' TO 'delivered';
            ALTER TYPE shipment_status RENAME VALUE 'CANCELLED' TO 'cancelled';
        END IF;
    END
    $$;
    ''')

    # Safe rename for trip_status
    op.execute('''
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'trip_status' AND enumlabel = 'CREATED') THEN
            ALTER TYPE trip_status RENAME VALUE 'CREATED' TO 'created';
            ALTER TYPE trip_status RENAME VALUE 'IN_TRANSIT' TO 'in_transit';
            ALTER TYPE trip_status RENAME VALUE 'COMPLETED' TO 'completed';
            ALTER TYPE trip_status RENAME VALUE 'CANCELLED' TO 'cancelled';
        END IF;
    END
    $$;
    ''')


def downgrade() -> None:
    pass
