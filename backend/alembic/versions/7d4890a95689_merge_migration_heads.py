"""merge migration heads

Revision ID: 7d4890a95689
Revises: 20260706_0001, 505054d898a0
Create Date: 2026-08-18 00:34:59.100333

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d4890a95689'
down_revision: Union[str, Sequence[str], None] = ('20260706_0001', '505054d898a0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
