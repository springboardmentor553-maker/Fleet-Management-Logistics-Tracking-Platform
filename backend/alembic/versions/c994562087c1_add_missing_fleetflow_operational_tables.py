"""add missing fleetflow operational tables

Revision ID: c994562087c1
Revises: 20260706_0001
Create Date: 2026-08-18 18:16:43.025106
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c994562087c1"
down_revision: Union[str, Sequence[str], None] = "20260706_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # =====================================================
    # TRIPS
    # =====================================================

    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shipment_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("pickup_location", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("pickup_latitude", sa.String(length=50), nullable=True),
        sa.Column("pickup_longitude", sa.String(length=50), nullable=True),
        sa.Column("destination_latitude", sa.String(length=50), nullable=True),
        sa.Column("destination_longitude", sa.String(length=50), nullable=True),
        sa.Column("scheduled_start_time", sa.DateTime(), nullable=False),
        sa.Column("scheduled_end_time", sa.DateTime(), nullable=False),
        sa.Column(
            "trip_status",
            sa.String(length=50),
            nullable=True,
            server_default="Scheduled",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["shipment_id"],
            ["shipments.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("shipment_id"),
    )

    op.create_index(
        "ix_trips_id",
        "trips",
        ["id"],
        unique=False,
    )

    # =====================================================
    # MAINTENANCE
    # =====================================================

    op.create_table(
        "maintenance",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("maintenance_category", sa.String(), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("next_service_date", sa.Date(), nullable=False),
        sa.Column("service_cost", sa.Float(), nullable=False),
        sa.Column("service_provider", sa.String(), nullable=False),
        sa.Column("maintenance_status", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("is_active", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_maintenance_id",
        "maintenance",
        ["id"],
        unique=False,
    )

    # =====================================================
    # DRIVER ASSIGNMENTS
    # =====================================================

    op.create_table(
        "driver_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column(
            "assigned_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(),
            nullable=True,
            server_default="Assigned",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_driver_assignments_id",
        "driver_assignments",
        ["id"],
        unique=False,
    )

    # =====================================================
    # DRIVER ATTENDANCE
    # =====================================================

    op.create_table(
        "driver_attendance",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("attendance_status", sa.String(), nullable=False),
        sa.Column("check_in_time", sa.Time(), nullable=True),
        sa.Column("check_out_time", sa.Time(), nullable=True),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_driver_attendance_id",
        "driver_attendance",
        ["id"],
        unique=False,
    )

    # =====================================================
    # FUEL LOGS
    # =====================================================

    op.create_table(
        "fuel_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("fuel_date", sa.Date(), nullable=False),
        sa.Column("fuel_quantity", sa.Float(), nullable=False),
        sa.Column("fuel_cost", sa.Float(), nullable=False),
        sa.Column("odometer_reading", sa.Integer(), nullable=False),
        sa.Column("fuel_station", sa.String(), nullable=False),
        sa.Column("remarks", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column("is_active", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_fuel_logs_id",
        "fuel_logs",
        ["id"],
        unique=False,
    )

    # =====================================================
    # MAINTENANCE ALERTS
    # =====================================================

    op.create_table(
        "maintenance_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("maintenance_id", sa.Integer(), nullable=False),
        sa.Column("alert_message", sa.String(), nullable=False),
        sa.Column("alert_type", sa.String(), nullable=False),
        sa.Column(
            "alert_status",
            sa.String(),
            nullable=True,
            server_default="Pending",
        ),
        sa.Column(
            "generated_date",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column("next_service_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.ForeignKeyConstraint(
            ["maintenance_id"],
            ["maintenance.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_maintenance_alerts_id",
        "maintenance_alerts",
        ["id"],
        unique=False,
    )


def downgrade() -> None:

    op.drop_index(
        "ix_maintenance_alerts_id",
        table_name="maintenance_alerts",
    )
    op.drop_table("maintenance_alerts")

    op.drop_index(
        "ix_fuel_logs_id",
        table_name="fuel_logs",
    )
    op.drop_table("fuel_logs")

    op.drop_index(
        "ix_driver_attendance_id",
        table_name="driver_attendance",
    )
    op.drop_table("driver_attendance")

    op.drop_index(
        "ix_driver_assignments_id",
        table_name="driver_assignments",
    )
    op.drop_table("driver_assignments")

    op.drop_index(
        "ix_maintenance_id",
        table_name="maintenance",
    )
    op.drop_table("maintenance")

    op.drop_index(
        "ix_trips_id",
        table_name="trips",
    )
    op.drop_table("trips")