"""Add persistent vehicle tracking fields

Revision ID: 2b0a6b981ae0
Revises: d0884227c72a
Create Date: 2026-08-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# ==========================================================
# REVISION IDENTIFICATION
# ==========================================================

revision: str = "2b0a6b981ae0"

down_revision: Union[str, Sequence[str], None] = "d0884227c72a"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


# ==========================================================
# UPGRADE
# ==========================================================

def upgrade() -> None:

    # ------------------------------------------------------
    # Current vehicle latitude
    # ------------------------------------------------------

    op.add_column(
        "trips",
        sa.Column(
            "current_latitude",
            sa.Float(),
            nullable=True
        )
    )

    # ------------------------------------------------------
    # Current vehicle longitude
    # ------------------------------------------------------

    op.add_column(
        "trips",
        sa.Column(
            "current_longitude",
            sa.Float(),
            nullable=True
        )
    )

    # ------------------------------------------------------
    # Progress
    #
    # IMPORTANT:
    # Add it nullable first so existing rows can receive 0.
    # ------------------------------------------------------

    op.add_column(
        "trips",
        sa.Column(
            "progress",
            sa.Float(),
            nullable=True
        )
    )

    # ------------------------------------------------------
    # Give all existing trips 0% progress
    # ------------------------------------------------------

    op.execute(
        """
        UPDATE trips
        SET progress = 0
        WHERE progress IS NULL
        """
    )

    # ------------------------------------------------------
    # Now make progress NOT NULL
    # ------------------------------------------------------

    op.alter_column(
        "trips",
        "progress",
        existing_type=sa.Float(),
        nullable=False
    )

    # ------------------------------------------------------
    # Remaining distance
    # ------------------------------------------------------

    op.add_column(
        "trips",
        sa.Column(
            "remaining_distance_km",
            sa.Float(),
            nullable=True
        )
    )

    # ------------------------------------------------------
    # Remaining duration
    # ------------------------------------------------------

    op.add_column(
        "trips",
        sa.Column(
            "remaining_duration_minutes",
            sa.Float(),
            nullable=True
        )
    )


# ==========================================================
# DOWNGRADE
# ==========================================================

def downgrade() -> None:

    op.drop_column(
        "trips",
        "remaining_duration_minutes"
    )

    op.drop_column(
        "trips",
        "remaining_distance_km"
    )

    op.drop_column(
        "trips",
        "progress"
    )

    op.drop_column(
        "trips",
        "current_longitude"
    )

    op.drop_column(
        "trips",
        "current_latitude"
    )