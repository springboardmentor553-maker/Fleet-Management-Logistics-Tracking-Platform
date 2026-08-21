from alembic import op
import sqlalchemy as sa


# Alembic revision identifiers
revision = "d41ca556fad3"
down_revision = "cea0682fbac5"
branch_labels = None
depends_on = None


def upgrade():

    op.alter_column(
        "trips",
        "departure_time",
        existing_type=sa.String(),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="departure_time::timestamp"
    )

    op.alter_column(
        "trips",
        "expected_arrival",
        existing_type=sa.String(),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="expected_arrival::timestamp"
    )


def downgrade():

    op.alter_column(
        "trips",
        "departure_time",
        existing_type=sa.DateTime(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="departure_time::text"
    )

    op.alter_column(
        "trips",
        "expected_arrival",
        existing_type=sa.DateTime(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="expected_arrival::text"
    )