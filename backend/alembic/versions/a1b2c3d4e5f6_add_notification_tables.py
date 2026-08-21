"""add notification tables

Revision ID: a1b2c3d4e5f6
Revises: 858377903bf4
Create Date: 2026-08-21

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"

down_revision: Union[str, Sequence[str], None] = "858377903bf4"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notification tables."""

    op.create_table(
        "notifications",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "title",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "message",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "notification_type",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "related_entity",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "related_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),

        sa.PrimaryKeyConstraint(
            "id",
        ),
    )

    op.create_index(
        "ix_notifications_id",
        "notifications",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_notifications_user_id",
        "notifications",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "notification_subscriptions",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "endpoint",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "p256dh",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "auth",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),

        sa.PrimaryKeyConstraint(
            "id",
        ),

        sa.UniqueConstraint(
            "endpoint",
        ),
    )

    op.create_index(
        "ix_notification_subscriptions_id",
        "notification_subscriptions",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_notification_subscriptions_user_id",
        "notification_subscriptions",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove notification tables."""

    op.drop_index(
        "ix_notification_subscriptions_user_id",
        table_name="notification_subscriptions",
    )

    op.drop_index(
        "ix_notification_subscriptions_id",
        table_name="notification_subscriptions",
    )

    op.drop_table(
        "notification_subscriptions",
    )

    op.drop_index(
        "ix_notifications_user_id",
        table_name="notifications",
    )

    op.drop_index(
        "ix_notifications_id",
        table_name="notifications",
    )

    op.drop_table(
        "notifications",
    )