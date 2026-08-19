"""Create new shipment table

Revision ID: 1f00fdc4a5cf
Revises: 6c810406890c
Create Date: 2026-07-16 17:26:28.310488

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f00fdc4a5cf'
down_revision: Union[str, Sequence[str], None] = '6c810406890c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass

def downgrade() -> None:
    """Downgrade schema."""
    pass