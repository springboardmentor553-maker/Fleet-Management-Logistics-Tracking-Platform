"""synchronize current FleetFlow schema

Revision ID: 947211bd4603
Revises: 91e860dece22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "947211bd4603"
down_revision: Union[str, Sequence[str], None] = "91e860dece22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 1. CREATE ENUMS REQUIRED BY CURRENT MODELS
    # ============================================================

    maintenance_category_enum = postgresql.ENUM(
        "OIL_CHANGE",
        "TYRE_REPLACEMENT",
        "BRAKE_SERVICE",
        "ENGINE_SERVICE",
        "GENERAL_INSPECTION",
        name="maintenance_category_enum",
    )

    attendance_status_enum = postgresql.ENUM(
        "PRESENT",
        "ABSENT",
        "LEAVE",
        name="attendancestatus",
    )

    alert_type_enum = postgresql.ENUM(
        "UPCOMING_SERVICE",
        "OVERDUE_SERVICE",
        "GENERAL",
        name="alert_type_enum",
    )

    alert_status_enum = postgresql.ENUM(
        "PENDING",
        "SENT",
        "COMPLETED",
        name="alert_status_enum",
    )

    maintenance_category_enum.create(op.get_bind(), checkfirst=True)
    attendance_status_enum.create(op.get_bind(), checkfirst=True)
    alert_type_enum.create(op.get_bind(), checkfirst=True)
    alert_status_enum.create(op.get_bind(), checkfirst=True)

    # ============================================================
    # 2. SYNCHRONIZE MAINTENANCE TABLE
    #
    # Existing maintenance table has 0 rows, so old columns can
    # safely be removed and replaced with the current model fields.
    # ============================================================

    op.drop_column("maintenance", "maintenance_type")
    op.drop_column("maintenance", "cost")
    op.drop_column("maintenance", "status")

    op.add_column(
        "maintenance",
        sa.Column(
            "maintenance_category",
            postgresql.ENUM(
                "OIL_CHANGE",
                "TYRE_REPLACEMENT",
                "BRAKE_SERVICE",
                "ENGINE_SERVICE",
                "GENERAL_INSPECTION",
                name="maintenance_category_enum",
                create_type=False,
            ),
            nullable=False,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "next_service_date",
            sa.Date(),
            nullable=True,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "service_cost",
            sa.Float(),
            nullable=False,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "service_provider",
            sa.String(length=255),
            nullable=False,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "maintenance_status",
            sa.String(length=50),
            nullable=False,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "maintenance",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    # ============================================================
    # 3. SYNCHRONIZE SHIPMENTS TABLE
    #
    # Existing shipments table has 0 rows.
    # Existing shipmentstatus enum already contains every value
    # required by the current Shipment model.
    # ============================================================

    op.drop_constraint(
        "shipments_shipment_number_key",
        "shipments",
        type_="unique",
    )

    op.drop_column("shipments", "shipment_number")
    op.drop_column("shipments", "source")
    op.drop_column("shipments", "destination")
    op.drop_column("shipments", "cargo")
    op.drop_column("shipments", "estimated_delivery")

    op.add_column(
        "shipments",
        sa.Column(
            "tracking_number",
            sa.String(),
            nullable=False,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "sender_name",
            sa.String(),
            nullable=False,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "pickup_location",
            sa.String(),
            nullable=False,
        ),
    )

    op.add_column(
        "shipments",
        sa.Column(
            "delivery_location",
            sa.String(),
            nullable=False,
        ),
    )

    op.alter_column(
        "shipments",
        "receiver_name",
        existing_type=sa.String(),
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "weight",
        existing_type=sa.Float(),
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "status",
        existing_type=sa.String(length=16),
        type_=postgresql.ENUM(
            "CREATED",
            "ASSIGNED",
            "IN_TRANSIT",
            "DELAYED",
            "DELIVERED",
            "CANCELLED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            name="shipmentstatus",
            create_type=False,
        ),
        postgresql_using="status::text::shipmentstatus",
        nullable=False,
    )

    op.alter_column(
        "shipments",
        "created_at",
        existing_type=sa.TIMESTAMP(),
        nullable=True,
    )

    op.create_index(
        "ix_shipments_id",
        "shipments",
        ["id"],
        unique=False,
    )

    op.create_unique_constraint(
        "uq_shipments_tracking_number",
        "shipments",
        ["tracking_number"],
    )

    # ============================================================
    # 4. TRIP COORDINATES MUST BE NOT NULL
    #
    # The table currently contains 0 rows.
    # ============================================================

    op.alter_column(
        "trips",
        "pickup_latitude",
        existing_type=sa.Float(),
        nullable=False,
    )

    op.alter_column(
        "trips",
        "pickup_longitude",
        existing_type=sa.Float(),
        nullable=False,
    )

    op.alter_column(
        "trips",
        "destination_latitude",
        existing_type=sa.Float(),
        nullable=False,
    )

    op.alter_column(
        "trips",
        "destination_longitude",
        existing_type=sa.Float(),
        nullable=False,
    )

    # ============================================================
    # 5. CREATE DRIVER ATTENDANCE
    # ============================================================

    op.create_table(
        "driver_attendance",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "driver_id",
            sa.Integer(),
            sa.ForeignKey("drivers.id"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "attendance_status",
            postgresql.ENUM(
                "PRESENT",
                "ABSENT",
                "LEAVE",
                name="attendancestatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("check_in_time", sa.Time(), nullable=True),
        sa.Column("check_out_time", sa.Time(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_driver_attendance_id",
        "driver_attendance",
        ["id"],
        unique=False,
    )

    # ============================================================
    # 6. CREATE FUEL RECORDS
    # ============================================================

    op.create_table(
        "fuel_records",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "vehicle_id",
            sa.Integer(),
            sa.ForeignKey("vehicles.id"),
            nullable=False,
        ),
        sa.Column(
            "driver_id",
            sa.Integer(),
            sa.ForeignKey("drivers.id"),
            nullable=False,
        ),
        sa.Column("fuel_quantity", sa.Float(), nullable=False),
        sa.Column("fuel_cost", sa.Float(), nullable=False),
        sa.Column("odometer_reading", sa.Float(), nullable=False),
        sa.Column("fuel_date", sa.Date(), nullable=False),
        sa.Column("fuel_station", sa.String(length=150), nullable=False),
        sa.Column("remarks", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_fuel_records_id",
        "fuel_records",
        ["id"],
        unique=False,
    )

    # ============================================================
    # 7. CREATE MAINTENANCE ALERTS
    # ============================================================

    op.create_table(
        "maintenance_alerts",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "vehicle_id",
            sa.Integer(),
            sa.ForeignKey("vehicles.id"),
            nullable=False,
        ),
        sa.Column(
            "maintenance_id",
            sa.Integer(),
            sa.ForeignKey("maintenance.id"),
            nullable=False,
        ),
        sa.Column(
            "alert_message",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "alert_type",
            postgresql.ENUM(
                "UPCOMING_SERVICE",
                "OVERDUE_SERVICE",
                "GENERAL",
                name="alert_type_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "alert_status",
            postgresql.ENUM(
                "PENDING",
                "SENT",
                "COMPLETED",
                name="alert_status_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "generated_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "next_service_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_maintenance_alerts_id",
        "maintenance_alerts",
        ["id"],
        unique=False,
    )

    # ============================================================
    # 8. CREATE DRIVER ASSIGNMENTS
    # ============================================================

    op.create_table(
        "driver_assignments",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "driver_id",
            sa.Integer(),
            sa.ForeignKey("drivers.id"),
            nullable=False,
        ),
        sa.Column(
            "vehicle_id",
            sa.Integer(),
            sa.ForeignKey("vehicles.id"),
            nullable=False,
        ),
        sa.Column(
            "trip_id",
            sa.Integer(),
            sa.ForeignKey("trips.id"),
            nullable=False,
        ),
        sa.Column("assignment_date", sa.Date(), nullable=False),
        sa.Column(
            "assignment_status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "remarks",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_driver_assignments_id",
        "driver_assignments",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    # Remove newly created tables.
    op.drop_index(
        "ix_driver_assignments_id",
        table_name="driver_assignments",
    )
    op.drop_table("driver_assignments")

    op.drop_index(
        "ix_maintenance_alerts_id",
        table_name="maintenance_alerts",
    )
    op.drop_table("maintenance_alerts")

    op.drop_index(
        "ix_fuel_records_id",
        table_name="fuel_records",
    )
    op.drop_table("fuel_records")

    op.drop_index(
        "ix_driver_attendance_id",
        table_name="driver_attendance",
    )
    op.drop_table("driver_attendance")

    # Restore trip coordinate nullability.
    op.alter_column(
        "trips",
        "destination_longitude",
        existing_type=sa.Float(),
        nullable=True,
    )
    op.alter_column(
        "trips",
        "destination_latitude",
        existing_type=sa.Float(),
        nullable=True,
    )
    op.alter_column(
        "trips",
        "pickup_longitude",
        existing_type=sa.Float(),
        nullable=True,
    )
    op.alter_column(
        "trips",
        "pickup_latitude",
        existing_type=sa.Float(),
        nullable=True,
    )

    # Restore shipment structure.
    op.drop_constraint(
        "uq_shipments_tracking_number",
        "shipments",
        type_="unique",
    )

    op.drop_index(
        "ix_shipments_id",
        table_name="shipments",
    )

    op.drop_column("shipments", "delivery_location")
    op.drop_column("shipments", "pickup_location")
    op.drop_column("shipments", "sender_name")
    op.drop_column("shipments", "tracking_number")

    op.add_column(
        "shipments",
        sa.Column("shipment_number", sa.String(), nullable=True),
    )
    op.add_column(
        "shipments",
        sa.Column("source", sa.String(), nullable=True),
    )
    op.add_column(
        "shipments",
        sa.Column("destination", sa.String(), nullable=True),
    )
    op.add_column(
        "shipments",
        sa.Column("cargo", sa.String(), nullable=True),
    )
    op.add_column(
        "shipments",
        sa.Column("estimated_delivery", sa.String(), nullable=True),
    )

    op.alter_column(
        "shipments",
        "status",
        existing_type=postgresql.ENUM(
            "CREATED",
            "ASSIGNED",
            "IN_TRANSIT",
            "DELAYED",
            "DELIVERED",
            "CANCELLED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            name="shipmentstatus",
            create_type=False,
        ),
        type_=sa.String(length=16),
        postgresql_using="status::text",
        nullable=True,
    )

    op.alter_column(
        "shipments",
        "weight",
        existing_type=sa.Float(),
        nullable=True,
    )

    op.alter_column(
        "shipments",
        "receiver_name",
        existing_type=sa.String(),
        nullable=True,
    )

    op.alter_column(
        "shipments",
        "created_at",
        existing_type=sa.TIMESTAMP(),
        nullable=False,
    )

    op.create_unique_constraint(
        "shipments_shipment_number_key",
        "shipments",
        ["shipment_number"],
    )

    # Restore old maintenance structure.
    op.drop_column("maintenance", "created_at")
    op.drop_column("maintenance", "notes")
    op.drop_column("maintenance", "maintenance_status")
    op.drop_column("maintenance", "service_provider")
    op.drop_column("maintenance", "service_cost")
    op.drop_column("maintenance", "next_service_date")
    op.drop_column("maintenance", "maintenance_category")

    op.add_column(
        "maintenance",
        sa.Column(
            "maintenance_type",
            sa.String(),
            nullable=False,
        ),
    )
    op.add_column(
        "maintenance",
        sa.Column(
            "cost",
            sa.Float(),
            nullable=False,
        ),
    )
    op.add_column(
        "maintenance",
        sa.Column(
            "status",
            sa.String(),
            nullable=True,
        ),
    )

    