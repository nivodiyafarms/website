"""task_fields junction

Revision ID: c7e2f91a4b38
Revises: a1b2c3d4e5f6
Create Date: 2026-07-04

Additive migration — no existing column or table is dropped.

  1. New table: task_fields (task_id, field_id) — composite PK.
     Mirrors crop_cycle_fields pattern; one task can span multiple fields.
     tasks.field_id column is KEPT as a legacy/safety net.
  2. Backfill: for every task that has a non-NULL field_id, insert one row
     into task_fields.  Idempotent: ON CONFLICT DO NOTHING.

Downgrade: drop task_fields (backfill is NOT reversed — tasks.field_id is
the authoritative single-field fallback).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'c7e2f91a4b38'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Create task_fields ────────────────────────────────────────────────
    op.create_table(
        'task_fields',
        sa.Column('task_id', UUID(), nullable=False),
        sa.Column('field_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ['task_id'], ['tasks.task_id'],
            name='task_fields_task_id_fkey', ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['field_id'], ['fields.field_id'],
            name='task_fields_field_id_fkey', ondelete='RESTRICT',
        ),
        sa.PrimaryKeyConstraint('task_id', 'field_id', name='task_fields_pkey'),
    )

    # ── 2. Backfill from tasks.field_id ──────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO task_fields (task_id, field_id)
        SELECT task_id, field_id
        FROM   tasks
        WHERE  field_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """))


def downgrade() -> None:
    op.drop_table('task_fields')
    # NOTE: task_fields data is NOT restored to tasks.field_id.
    # tasks.field_id was never cleared by upgrade so it remains intact.
