"""Extend shipmentstatus enum: fix casing and add new values

The PostgreSQL shipmentstatus enum currently has uppercase labels
(CREATED, ASSIGNED, IN_TRANSIT, DELAYED, DELIVERED, CANCELLED) while the
Python model uses title-case values.

This migration:
1. Converts the column to TEXT (breaks the enum dependency).
2. Remaps existing uppercase data to the correct title-case values.
3. Drops the old uppercase enum.
4. Creates the new enum with all 8 title-case values including the two new
   ones: 'Picked Up' and 'Out for Delivery'.
5. Re-attaches the column to the new enum type.
6. Restores the column default.

All existing data is preserved — no rows are lost.

Revision ID: c1d2e3f4a5b6
Revises: e9a1b2c3d4e5
Create Date: 2026-07-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'e9a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Full set of new enum labels (title-case, 8 values)
NEW_ENUM_VALUES = (
    'Created',
    'Assigned',
    'Picked Up',
    'In Transit',
    'Out for Delivery',
    'Delivered',
    'Delayed',
    'Cancelled',
)

# The 6 original uppercase labels (what exists in PostgreSQL right now)
OLD_ENUM_VALUES = (
    'CREATED',
    'ASSIGNED',
    'IN_TRANSIT',
    'DELAYED',
    'DELIVERED',
    'CANCELLED',
)

# Mapping from old uppercase labels to new title-case labels
_UPGRADE_MAP = {
    'CREATED': 'Created',
    'ASSIGNED': 'Assigned',
    'IN_TRANSIT': 'In Transit',
    'DELAYED': 'Delayed',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
}

# Mapping from new title-case labels back to old uppercase (for downgrade)
_DOWNGRADE_MAP = {v: k for k, v in _UPGRADE_MAP.items()}
# New labels that have no old equivalent — map to nearest safe old value
_DOWNGRADE_MAP['Picked Up'] = 'ASSIGNED'
_DOWNGRADE_MAP['Out for Delivery'] = 'IN_TRANSIT'


def upgrade() -> None:
    """
    Migrate shipmentstatus from 6 uppercase labels to 8 title-case labels.

    All existing rows are remapped; no data is lost.
    """
    # 1. Detach the column from the enum (convert to TEXT)
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status TYPE TEXT "
        "USING current_status::TEXT"
    )

    # 2. Remap existing uppercase values to title-case
    for old_val, new_val in _UPGRADE_MAP.items():
        op.execute(
            f"UPDATE shipments SET current_status = '{new_val}' "
            f"WHERE current_status = '{old_val}'"
        )

    # 3. Drop the old uppercase enum type
    op.execute("DROP TYPE IF EXISTS shipmentstatus")

    # 4. Create the new enum with all 8 title-case values
    new_enum = postgresql.ENUM(*NEW_ENUM_VALUES, name='shipmentstatus', create_type=False)
    new_enum.create(op.get_bind(), checkfirst=True)

    # 5. Re-attach column to the new enum type
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status "
        "TYPE shipmentstatus USING current_status::shipmentstatus"
    )

    # 6. Restore the column default
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status "
        "SET DEFAULT 'Created'::shipmentstatus"
    )


def downgrade() -> None:
    """
    Revert to the original 6 uppercase enum labels.

    Rows with 'Picked Up' are mapped back to 'ASSIGNED'.
    Rows with 'Out for Delivery' are mapped back to 'IN_TRANSIT'.
    All other rows are mapped back to their original uppercase values.
    """
    # 1. Detach column from enum
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status TYPE TEXT "
        "USING current_status::TEXT"
    )

    # 2. Remap all title-case values back to uppercase
    for new_val, old_val in _DOWNGRADE_MAP.items():
        op.execute(
            f"UPDATE shipments SET current_status = '{old_val}' "
            f"WHERE current_status = '{new_val}'"
        )

    # 3. Drop the new enum
    op.execute("DROP TYPE IF EXISTS shipmentstatus")

    # 4. Recreate the original 6-value uppercase enum
    old_enum = postgresql.ENUM(*OLD_ENUM_VALUES, name='shipmentstatus', create_type=False)
    old_enum.create(op.get_bind(), checkfirst=True)

    # 5. Re-attach column
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status "
        "TYPE shipmentstatus USING current_status::shipmentstatus"
    )

    # 6. Restore original default
    op.execute(
        "ALTER TABLE shipments ALTER COLUMN current_status "
        "SET DEFAULT 'CREATED'::shipmentstatus"
    )
