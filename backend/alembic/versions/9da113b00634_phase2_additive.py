"""phase2_additive

Revision ID: 9da113b00634
Revises: f96a71662e37
Create Date: 2026-06-17 18:52:42.294965

All changes are ADDITIVE — no existing column/table is dropped or renamed.

  0. Backfill: crop_cycle_fields.allocated_acres ← crop_cycles.cultivated_area
     Pre-flight: abort if any crop_cycle has NULL cultivated_area.
  1. New enum: worker_role_enum (worker/supervisor/owner)
  2. New enum: sale_channel_enum (mandi/society/private/seed_lot)
  3. New enum: expense_review_status_enum (unreviewed/verified/void)
  4. New table: workers
  5. New column: work_orders.assigned_to (uuid nullable, FK → workers NOT VALID)
     NOT VALID skips validation of existing rows (they hold legacy user UUIDs).
     Run VALIDATE CONSTRAINT after populating workers if desired.
  6. New table: sales
  7. New table: yields
  8. New table: prep_cost_allocation
     work_order_id is the sole source anchor: cost lives in work_order_resources.
     App MUST enforce SUM(amount) per work_order_id ≤ WO total resource cost —
     SQL CHECK cannot aggregate across rows, so this is an application-level rule.
  9. New columns on general_expense: review_status, reviewed_by, void_reason
     review_status defaults to 'unreviewed'; expenses post immediately and are
     verified after (verify-after model per CLAUDE.md).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM as PGEnum


revision: str = '9da113b00634'
down_revision: Union[str, None] = 'f96a71662e37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 0. BACKFILL ────────────────────────────────────────────────────────────
    # Guard: if any crop_cycle has NULL cultivated_area there is nothing to copy.
    null_count = conn.execute(
        sa.text("SELECT COUNT(*) FROM crop_cycles WHERE cultivated_area IS NULL")
    ).scalar()
    if null_count:
        raise RuntimeError(
            f"STOP: {null_count} crop_cycle(s) have NULL cultivated_area. "
            "Resolve before running this migration."
        )
    conn.execute(sa.text("""
        UPDATE crop_cycle_fields ccf
        SET    allocated_acres = cc.cultivated_area
        FROM   crop_cycles cc
        WHERE  ccf.crop_cycle_id = cc.crop_cycle_id
          AND  ccf.allocated_acres IS NULL
    """))

    # ── 1-3. New enum types ────────────────────────────────────────────────────
    conn.execute(sa.text(
        "CREATE TYPE worker_role_enum AS ENUM ('worker', 'supervisor', 'owner')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE sale_channel_enum "
        "AS ENUM ('mandi', 'society', 'private', 'seed_lot')"
    ))
    conn.execute(sa.text(
        "CREATE TYPE expense_review_status_enum "
        "AS ENUM ('unreviewed', 'verified', 'void')"
    ))

    # ── 4. Table: workers ──────────────────────────────────────────────────────
    op.create_table(
        'workers',
        sa.Column('worker_id', UUID(), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('whatsapp_number', sa.Text(), nullable=True),
        sa.Column(
            'role',
            PGEnum('worker', 'supervisor', 'owner',
                   name='worker_role_enum', create_type=False),
            nullable=False,
        ),
        sa.Column('active', sa.Boolean(), nullable=False,
                  server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('worker_id', name='workers_pkey'),
    )

    # ── 5. work_orders.assigned_to FK ─────────────────────────────────────────
    # Column already exists (hand-edited into DB before Alembic; captured in baseline).
    # Add the FK constraint only. NOT VALID skips validation of existing rows
    # (they may hold legacy user UUIDs, not worker_ids). VALIDATE CONSTRAINT later
    # once workers are populated.
    conn.execute(sa.text(
        "ALTER TABLE work_orders "
        "ADD CONSTRAINT work_orders_assigned_to_fkey "
        "FOREIGN KEY (assigned_to) REFERENCES workers(worker_id) NOT VALID"
    ))

    # ── 6. Table: sales ────────────────────────────────────────────────────────
    op.create_table(
        'sales',
        sa.Column('sale_id', UUID(), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('crop_cycle_id', UUID(), nullable=False),
        sa.Column('sale_date', sa.Date(), nullable=False),
        sa.Column('quantity', sa.Numeric(), nullable=False),
        sa.Column('unit', sa.Text(), nullable=False),
        sa.Column('rate', sa.Numeric(), nullable=False),
        sa.Column('total_amount', sa.Numeric(), nullable=False),
        sa.Column('buyer', sa.Text(), nullable=True),
        sa.Column(
            'channel',
            PGEnum('mandi', 'society', 'private', 'seed_lot',
                   name='sale_channel_enum', create_type=False),
            nullable=False,
        ),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(
            ['crop_cycle_id'], ['crop_cycles.crop_cycle_id'],
            name='sales_crop_cycle_id_fkey', ondelete='RESTRICT',
        ),
        sa.PrimaryKeyConstraint('sale_id', name='sales_pkey'),
    )

    # ── 7. Table: yields ───────────────────────────────────────────────────────
    op.create_table(
        'yields',
        sa.Column('yield_id', UUID(), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('crop_cycle_id', UUID(), nullable=False),
        sa.Column('field_id', sa.String(), nullable=True),
        sa.Column('harvest_date', sa.Date(), nullable=False),
        sa.Column('quantity', sa.Numeric(), nullable=False),
        sa.Column('unit', sa.Text(), nullable=False),
        sa.Column('quality_grade', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(
            ['crop_cycle_id'], ['crop_cycles.crop_cycle_id'],
            name='yields_crop_cycle_id_fkey', ondelete='RESTRICT',
        ),
        sa.ForeignKeyConstraint(
            ['field_id'], ['fields.field_id'],
            name='yields_field_id_fkey',
        ),
        sa.PrimaryKeyConstraint('yield_id', name='yields_pkey'),
    )

    # ── 8. Table: prep_cost_allocation ─────────────────────────────────────────
    # Anchor: work_order_id (cost lives in work_order_resources under the WO).
    # Over-allocation guard is app-level: SUM(amount) per WO ≤ WO resource total.
    op.create_table(
        'prep_cost_allocation',
        sa.Column('id', UUID(), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('work_order_id', UUID(), nullable=False),
        sa.Column('crop_cycle_id', UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(
            ['work_order_id'], ['work_orders.work_order_id'],
            name='prep_cost_allocation_work_order_id_fkey', ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['crop_cycle_id'], ['crop_cycles.crop_cycle_id'],
            name='prep_cost_allocation_crop_cycle_id_fkey', ondelete='RESTRICT',
        ),
        sa.PrimaryKeyConstraint('id', name='prep_cost_allocation_pkey'),
    )

    # ── 9. general_expense: review workflow columns ────────────────────────────
    # Verify-after model: expense posts immediately as 'unreviewed'.
    # Supervisor reviews in app: VERIFY, EDIT, or VOID (never hard-delete).
    op.add_column('general_expense', sa.Column(
        'review_status',
        PGEnum('unreviewed', 'verified', 'void',
               name='expense_review_status_enum', create_type=False),
        nullable=False,
        server_default=sa.text("'unreviewed'"),
    ))
    op.add_column('general_expense',
                  sa.Column('reviewed_by', UUID(), nullable=True))
    op.add_column('general_expense',
                  sa.Column('void_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    # ── Reverse 9 ──────────────────────────────────────────────────────────────
    op.drop_column('general_expense', 'void_reason')
    op.drop_column('general_expense', 'reviewed_by')
    op.drop_column('general_expense', 'review_status')

    # ── Reverse 8 ──────────────────────────────────────────────────────────────
    op.drop_table('prep_cost_allocation')

    # ── Reverse 7 ──────────────────────────────────────────────────────────────
    op.drop_table('yields')

    # ── Reverse 6 ──────────────────────────────────────────────────────────────
    op.drop_table('sales')

    # ── Reverse 5 ──────────────────────────────────────────────────────────────
    # Drop the FK constraint only; the column pre-existed and must not be dropped.
    op.drop_constraint('work_orders_assigned_to_fkey', 'work_orders',
                       type_='foreignkey')

    # ── Reverse 4 ──────────────────────────────────────────────────────────────
    op.drop_table('workers')

    # ── Reverse 1-3: safe to DROP — these types exist only from this migration ─
    op.execute(sa.text("DROP TYPE IF EXISTS expense_review_status_enum"))
    op.execute(sa.text("DROP TYPE IF EXISTS sale_channel_enum"))
    op.execute(sa.text("DROP TYPE IF EXISTS worker_role_enum"))

    # NOTE: the allocated_acres backfill (step 0) is NOT reversed.
    # Restoring NULL values would require a separate data migration.
