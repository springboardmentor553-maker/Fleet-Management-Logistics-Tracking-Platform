"""create maintenance alerts table

Revision ID: 6925e6d09bfc
Revises: b9e941ce0113
Create Date: 2026-08-10 18:11:38.218360
"""

from typing import Sequence, Union

from alembic import op


revision: str = "6925e6d09bfc"
down_revision: Union[str, Sequence[str], None] = "b9e941ce0113"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass