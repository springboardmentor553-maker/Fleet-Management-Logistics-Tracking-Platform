"""sync current FleetFlow models

Revision ID: 91e860dece22
Revises: ef479a9918dc
"""

from typing import Sequence, Union

from alembic import op


revision: str = "91e860dece22"
down_revision: Union[str, Sequence[str], None] = "ef479a9918dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The FleetFlow database already contains the schema represented
    # by this synchronization migration.
    #
    # Existing objects:
    # - attendance_status_enum
    # - maintenance_category_enum
    # - alert_type_enum
    # - alert_status_enum
    # - driver_attendance
    # - fuel_records
    # - maintenance_alerts
    # - driver_assignments
    # - required maintenance columns
    # - required shipment columns
    #
    # No schema changes are required.


    def downgrade() -> None:
    # This migration only synchronizes the migration history with
    # an already-existing database schema.
    #
    # Do not drop existing FleetFlow tables, columns, or enums.
        pass