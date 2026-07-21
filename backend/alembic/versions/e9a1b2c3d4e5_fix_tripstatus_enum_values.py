"""Fix tripstatus enum values to match Python model

The original migration created the tripstatus enum with uppercase labels:
  PENDING, IN_TRANSIT, COMPLETED, CANCELLED

The Python TripStatus enum was later changed to use title-case values:
  Created, Assigned, In Transit, Delivered, Cancelled

This migration drops the trips table's dependency on the old enum,
recreates the enum with the correct labels, and restores the column.
Because the trips table had no rows at the time of this migration,
no data conversion is needed.

Revision ID: e9a1b2c3d4e5
Revises: b3c8d1e2f9a0
Create Date: 2026-07-21 22:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e9a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'b3c8d1e2f9a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The old enum labels that exist in PostgreSQL right now
OLD_ENUM_VALUES = ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')

# The new enum labels that match TripStatus.value in the Python model
NEW_ENUM_VALUES = ('Created', 'Assigned', 'In Transit', 'Delivered', 'Cancelled')


def upgrade() -> None:
    """
    Replace the tripstatus PostgreSQL enum with the correct labels.

    Steps:
    1. Change the column type to TEXT (breaking the enum FK so we can drop it)
    2. Drop the old enum type
    3. Create the new enum type with the correct labels
    4. Alter the column back to the new enum type
       (NULL rows stay NULL; no data existed so no casting is needed)
    """
    # 1. Detach the column from the enum by converting to plain text
    op.execute(
        "ALTER TABLE trips ALTER COLUMN trip_status TYPE TEXT USING trip_status::TEXT"
    )

    # 2. Drop the stale enum
    op.execute("DROP TYPE IF EXISTS tripstatus")

    # 3. Create the new enum with the correct labels
    new_enum = postgresql.ENUM(*NEW_ENUM_VALUES, name='tripstatus', create_type=False)
    new_enum.create(op.get_bind(), checkfirst=True)

    # 4. Re-attach the column to the new enum type
    #    Existing rows: the table had no data, so no USING cast is needed.
    op.execute(
        "ALTER TABLE trips ALTER COLUMN trip_status "
        "TYPE tripstatus USING trip_status::tripstatus"
    )

    # 5. Restore the column default that SQLAlchemy expects
    op.execute(
        "ALTER TABLE trips ALTER COLUMN trip_status SET DEFAULT 'Created'::tripstatus"
    )


def downgrade() -> None:
    """Restore the original tripstatus enum labels."""
    # 1. Detach column
    op.execute(
        "ALTER TABLE trips ALTER COLUMN trip_status TYPE TEXT USING trip_status::TEXT"
    )

    # 2. Drop current enum
    op.execute("DROP TYPE IF EXISTS tripstatus")

    # 3. Recreate old enum
    old_enum = postgresql.ENUM(*OLD_ENUM_VALUES, name='tripstatus', create_type=False)
    old_enum.create(op.get_bind(), checkfirst=True)

    # 4. Re-attach
    op.execute(
        "ALTER TABLE trips ALTER COLUMN trip_status "
        "TYPE tripstatus USING trip_status::tripstatus"
    )
