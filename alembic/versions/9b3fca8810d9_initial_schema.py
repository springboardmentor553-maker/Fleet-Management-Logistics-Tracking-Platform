"""initial_schema

Revision ID: 9b3fca8810d9
Revises: 
Create Date: 2026-07-22 08:15:23.628709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b3fca8810d9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
    # ### end Alembic commands ###
