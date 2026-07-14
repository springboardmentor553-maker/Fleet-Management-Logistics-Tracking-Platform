"""Add trips table

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2026-07-14 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5g6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the trips table using raw SQL to avoid SQLAlchemy enum conflicts."""
    conn = op.get_bind()

    # Safely create the enum type (idempotent via PL/pgSQL block)
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE tripstatusenum AS ENUM (
                'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # Create trips table using raw DDL so SQLAlchemy does not touch the enum type
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS trips (
            id                   SERIAL PRIMARY KEY,
            shipment_id          INTEGER UNIQUE
                                 REFERENCES shipments(id) ON DELETE SET NULL,
            driver_id            INTEGER
                                 REFERENCES drivers(id) ON DELETE SET NULL,
            vehicle_id           INTEGER
                                 REFERENCES vehicles(id) ON DELETE SET NULL,
            pickup_location      VARCHAR NOT NULL,
            destination          VARCHAR NOT NULL,
            scheduled_start_time TIMESTAMP NOT NULL,
            scheduled_end_time   TIMESTAMP,
            status               tripstatusenum NOT NULL DEFAULT 'SCHEDULED',
            created_at           TIMESTAMP NOT NULL DEFAULT NOW()
        );
    """))

    # Indexes for common query patterns
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_trips_id ON trips (id);"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_trips_driver_id ON trips (driver_id);"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_trips_vehicle_id ON trips (vehicle_id);"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_trips_status ON trips (status);"
    ))

    # Tell Alembic to stamp this revision as applied (table created above)
    # Nothing else needed – the alembic_version row is managed by the framework.


def downgrade() -> None:
    """Drop trips table and its enum type."""
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS trips;"))
    conn.execute(sa.text("DROP TYPE IF EXISTS tripstatusenum;"))
