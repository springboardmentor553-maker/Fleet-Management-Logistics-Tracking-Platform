"""add_new_shipment_statuses

Revision ID: a9fbb3edf93b
Revises: b850a229bd23
Create Date: 2026-07-23 21:48:43.583620

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9fbb3edf93b'
down_revision: Union[str, Sequence[str], None] = 'b850a229bd23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
