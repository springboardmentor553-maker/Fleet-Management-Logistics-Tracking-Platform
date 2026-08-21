"""recreate maintenance_alerts

Revision ID: 90c3bda347a8
Revises: 6925e6d09bfc
Create Date: 2026-08-10 18:26:46.888637
"""

from typing import Sequence, Union

from alembic import op


revision: str = "90c3bda347a8"
down_revision: Union[str, Sequence[str], None] = "6925e6d09bfc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
